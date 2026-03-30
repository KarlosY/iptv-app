import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // We decode the url passed in Base64 logic from frontend to avoid URL malformations
        const fetchUrl = Buffer.from(targetUrl, 'base64').toString('utf-8');
        
        console.log(`[Proxy] Fetching: ${fetchUrl}`);
        
        const response = await fetch(fetchUrl, {
            cache: 'no-store', // FORZAR no usar caché corrupta de Next.js
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }
        
        const text = await response.text();
        console.log(`[Proxy] Success! Fetched ${text.length} bytes for ${fetchUrl}`);
        
        // Re-transmit as plain CORS-free payload
        return new NextResponse(text, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 's-maxage=600, stale-while-revalidate'
            }
        });
    } catch (error: any) {
        return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
