import { NextResponse } from 'next/server';
import axios from 'axios';
import { extractOpenGraphAsync } from '@devmehq/open-graph-extractor';
// Force Git Update 2026-01-23 - TypeScript fix
export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // SSRF guard: only allow public http(s) targets.
    if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http(s) URLs are allowed' }, { status: 400 });
    }
    if (isBlockedHost(validUrl.hostname)) {
      return NextResponse.json({ error: 'This host is not allowed' }, { status: 400 });
    }

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
      maxContentLength: 5 * 1024 * 1024, // cap response at 5MB
      // Re-validate every redirect hop so a public URL can't bounce us to an internal host.
      beforeRedirect: (options: any) => {
        if (isBlockedHost(options.hostname || options.host)) {
          throw new Error('Redirect to a blocked host');
        }
      },
    });

    const extraction = await extractOpenGraphAsync(html, {
      allMedia: true,
      extractStructuredData: true,
    });

    const metadata = extraction.data;
    const domain = validUrl.hostname;

    // Smart Logo Detection - Safe Access Fix
    let ogImageUrl: string | undefined;
    if (Array.isArray(metadata.ogImage)) {
      const firstImage = metadata.ogImage[0];
      ogImageUrl = typeof firstImage === 'object' && firstImage !== null ? firstImage.url : firstImage;
    } else if (metadata.ogImage && typeof metadata.ogImage === 'object') {
      ogImageUrl = (metadata.ogImage as any).url;
    } else {
      ogImageUrl = metadata.ogImage as string | undefined;
    }

    let logo_url = ogImageUrl || metadata.favicon;

    // Fallback to Clearbit for cleaner brand logos if it's a root domain
    if (!logo_url || logo_url.includes('favicon.ico')) {
      logo_url = `https://logo.clearbit.com/${domain}`;
    }

    // Final fallback to Google Favicon API
    if (!logo_url) {
      logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }

    const result = {
      title: metadata.ogTitle || metadata.twitterTitle || domain,
      description: metadata.ogDescription || metadata.twitterDescription || '',
      logo_url,
      preview_image_url: ogImageUrl || '',
      category: detectCategory(metadata),
      tags: generateTags(metadata),
      domain,
      metadata_json: metadata,
      ai_summary: generateMockSummary(metadata),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Link analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze link' }, { status: 500 });
  }
}

// Block requests to loopback, private, link-local, and other non-public hosts (SSRF defense).
function isBlockedHost(hostname: string): boolean {
  if (!hostname) return true;
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '0.0.0.0' || host === '::1' || host === '::') return true;

  // IPv4 literal ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 127) return true;                         // loopback
    if (a === 0) return true;                           // 0.0.0.0/8
    if (a === 169 && b === 254) return true;            // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;  // carrier-grade NAT
  }

  // IPv6 private / unique-local / link-local
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true;

  return false;
}

function detectCategory(metadata: any): string {
  const content = (metadata.ogTitle + ' ' + metadata.ogDescription).toLowerCase();
  if (content.includes('api') || content.includes('developer')) return 'API';
  if (content.includes('ai') || content.includes('model') || content.includes('llm')) return 'AI';
  if (content.includes('video') || content.includes('youtube')) return 'Video';
  if (content.includes('github') || content.includes('repo')) return 'Dev Tools';
  if (content.includes('saas') || content.includes('business')) return 'SaaS';
  return 'Tech';
}

function generateTags(metadata: any): string[] {
  const content = (metadata.ogTitle + ' ' + metadata.ogDescription).toLowerCase();
  const possibleTags = ['react', 'nextjs', 'tailwind', 'database', 'automation', 'productivity', 'open-source'];
  const tags = possibleTags.filter(tag => content.includes(tag));
  return tags.length > 0 ? tags : ['web'];
}

function generateMockSummary(metadata: any): string {
  const desc = metadata.ogDescription || '';
  if (desc.length > 100) return desc.substring(0, 97) + '...';
  return desc;
}
