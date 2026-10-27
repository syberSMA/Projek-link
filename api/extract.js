export default async function handler(req, res) {
    // Buka akses CORS biar frontend bisa nembak
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'Parameter URL kosong' });

    try {
        // Server Vercel yang nge-fetch, bukan browser lo (Bebas CORS)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });
        
        const html = await response.text();
        let targetUrl = null;

        // 1. Cari Meta Refresh
        const metaMatch = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?\d+;\s*url=([^"'>\s]+)/i);
        if (metaMatch) targetUrl = metaMatch[1].replace(/&amp;/g, '&');

        // 2. Cari Window Location
        if (!targetUrl) {
            const winMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
            if (winMatch) targetUrl = winMatch[1];
        }

        // 3. Cari Base64 (Safelinku style)
        if (!targetUrl) {
            const b64Match = html.match(/atob\(['"]([^'"]+)['"]\)/);
            if (b64Match) { try { targetUrl = atob(b64Match[1]); } catch(e) {} }
        }

        // 4. Cari di link <a> yang ada tulisan "download" atau "here"
        if (!targetUrl) {
            const aMatch = html.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(?:(?!<\/a>).)*?(?:download|here|klik|lanjut)/i);
            if (aMatch) targetUrl = aMatch[1];
        }

        if (targetUrl && targetUrl.startsWith('http')) {
            return res.status(200).json({ success: true, url: targetUrl });
        } else {
            return res.status(200).json({ success: false, error: 'Link asli tidak ditemukan di HTML (Mungkin butuh bypass JS/Timer/Captcha)' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Gagal mengambil halaman: ' + error.message });
    }
}
