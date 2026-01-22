import { NextResponse } from 'next/server';
import axios from 'axios';
import { extractOpenGraphAsync } from '@devmehq/open-graph-extractor';

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

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });

    const extraction = await extractOpenGraphAsync(html, {
      allMedia: true,
      extractStructuredData: true,
    });

    const metadata = extraction.data;
    const domain = validUrl.hostname;

    // Smart Logo Detection
    const ogImage = Array.isArray(metadata.ogImage) ? metadata.ogImage[0] : metadata.ogImage;
    const ogImageUrl = typeof ogImage === 'object' ? ogImage?.url : ogImage;

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
