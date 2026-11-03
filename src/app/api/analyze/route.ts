import http from 'node:http';
import https from 'node:https';
import axios from 'axios';
import { extractOpenGraphAsync } from '@devmehq/open-graph-extractor';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isBlockedHostname, safeLookup } from '@/lib/network-security';

export const runtime = 'nodejs';

const MAX_URL_LENGTH = 2_048;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const requests = new Map<string, { count: number; resetAt: number }>();
const httpAgent = new http.Agent({ keepAlive: true, lookup: safeLookup });
const httpsAgent = new https.Agent({ keepAlive: true, lookup: safeLookup });

interface OpenGraphMetadata {
  ogTitle?: string;
  twitterTitle?: string;
  ogDescription?: string;
  twitterDescription?: string;
  favicon?: string;
  ogImage?: string | { url?: string } | Array<string | { url?: string }>;
  [key: string]: unknown;
}

function consumeRateLimit(userId: string) {
  const now = Date.now();
  const current = requests.get(userId);
  if (!current || current.resetAt <= now) {
    requests.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= RATE_LIMIT) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function parsePublicUrl(value: unknown) {
  if (typeof value !== 'string' || !value || value.length > MAX_URL_LENGTH) throw new Error('Invalid URL');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http(s) URLs are allowed');
  if (url.username || url.password) throw new Error('URLs with embedded credentials are not allowed');
  if (isBlockedHostname(url.hostname)) throw new Error('This host is not allowed');
  const expectedPort = url.protocol === 'https:' ? '443' : '80';
  if (url.port && url.port !== expectedPort) throw new Error('Only standard web ports are allowed');
  return url;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const rate = consumeRateLimit(user.id);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const url = parsePublicUrl(typeof body === 'object' && body !== null && 'url' in body ? body.url : undefined);

    const { data: html } = await axios.get<string>(url.href, {
      headers: { 'User-Agent': 'Cognify-Link-Preview/1.0' },
      timeout: 5_000,
      maxContentLength: 5 * 1024 * 1024,
      responseType: 'text',
      maxRedirects: 5,
      httpAgent,
      httpsAgent,
      beforeRedirect: (options) => {
        const hostname = options.hostname ?? options.host ?? '';
        if (isBlockedHostname(hostname)) throw new Error('Redirect to a blocked host');
      },
    });

    const extraction = await extractOpenGraphAsync(html, { allMedia: true, extractStructuredData: true });
    const metadata = extraction.data as OpenGraphMetadata;
    const domain = url.hostname;
    const ogImageUrl = firstImageUrl(metadata.ogImage);
    let logoUrl = ogImageUrl || metadata.favicon;
    if (!logoUrl || logoUrl.includes('favicon.ico')) logoUrl = `https://logo.clearbit.com/${domain}`;
    if (!logoUrl) logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    return NextResponse.json({
      title: metadata.ogTitle || metadata.twitterTitle || domain,
      description: metadata.ogDescription || metadata.twitterDescription || '',
      logo_url: logoUrl,
      preview_image_url: ogImageUrl || '',
      category: detectCategory(metadata),
      tags: generateTags(metadata),
      domain,
      metadata_json: metadata,
      ai_summary: generateSummary(metadata),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze link';
    const clientError = /Invalid URL|Only http|embedded credentials|host is not allowed|standard web ports/.test(message);
    if (!clientError) console.error('Link analysis error:', error);
    return NextResponse.json({ error: clientError ? message : 'Failed to analyze link' }, { status: clientError ? 400 : 500 });
  }
}

function firstImageUrl(image: OpenGraphMetadata['ogImage']) {
  const first = Array.isArray(image) ? image[0] : image;
  if (typeof first === 'string') return first;
  return first && typeof first === 'object' && typeof first.url === 'string' ? first.url : undefined;
}

function metadataText(metadata: OpenGraphMetadata) {
  return `${metadata.ogTitle ?? ''} ${metadata.ogDescription ?? ''}`.toLowerCase();
}

function detectCategory(metadata: OpenGraphMetadata) {
  const content = metadataText(metadata);
  if (content.includes('api') || content.includes('developer')) return 'API';
  if (content.includes('ai') || content.includes('model') || content.includes('llm')) return 'AI';
  if (content.includes('video') || content.includes('youtube')) return 'Video';
  if (content.includes('github') || content.includes('repo')) return 'Dev Tools';
  if (content.includes('saas') || content.includes('business')) return 'SaaS';
  return 'Tech';
}

function generateTags(metadata: OpenGraphMetadata) {
  const content = metadataText(metadata);
  const tags = ['react', 'nextjs', 'tailwind', 'database', 'automation', 'productivity', 'open-source'].filter((tag) => content.includes(tag));
  return tags.length ? tags : ['web'];
}

function generateSummary(metadata: OpenGraphMetadata) {
  const description = metadata.ogDescription ?? '';
  return description.length > 100 ? `${description.slice(0, 97)}...` : description;
}
