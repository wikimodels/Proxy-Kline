export const config = {
    runtime: "edge",
    regions: ["cdg1"],
  };
  
  export default async function handler(request: Request) {
    // Validate request method
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { 
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  
    // Parse and validate URL
    const url = new URL(request.url);
    const targetPath = url.pathname.replace('/api/proxy/', '');
    
    if (!targetPath.startsWith('api/')) {
      return new Response('Invalid endpoint', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  
    const targetUrl = new URL(`https://api.binance.com/${targetPath}${url.search}`);
  
    // Clone and modify headers
    const headers = new Headers(request.headers);
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );
    //
    headers.set("Accept", "*/*");
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Origin", "https://www.binance.com");
    headers.set("Referer", "https://www.binance.com/");
  
    // Remove Vercel identifiers
    ['x-vercel-id', 'x-vercel-ip-country', 'x-vercel-deployment-url'].forEach(h => headers.delete(h));
  
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method === 'GET' ? null : request.body,
      });
  
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers),
          "Access-Control-Allow-Origin": "*",
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },