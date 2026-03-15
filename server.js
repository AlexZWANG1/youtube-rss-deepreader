import { createServer } from 'http';
import { readFile, writeFile, readdir, mkdir, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const { fetchTranscript } = await import('youtube-transcript/dist/youtube-transcript.esm.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve index.html
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = await readFile(join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Transcript API
  if (url.pathname === '/api/transcript') {
    const videoId = url.searchParams.get('v');
    const lang = url.searchParams.get('lang');
    if (!videoId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing video ID (?v=xxx)' }));
      return;
    }
    try {
      const segments = await fetchTranscript(videoId, lang ? { lang } : undefined);
      const text = segments.map(s => s.text).join(' ');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text, segments }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // RSS proxy
  if (url.pathname === '/api/rss') {
    const feedUrl = url.searchParams.get('url');
    if (!feedUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing feed URL (?url=xxx)' }));
      return;
    }
    try {
      const resp = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YTRSSReader/1.0)' }
      });
      const xml = await resp.text();
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(xml);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Save cover image
  if (url.pathname === '/api/save-image' && req.method === 'POST') {
    let body = '';
    let tooLarge = false;
    req.on('data', chunk => { body += chunk; if (body.length > 20_000_000) tooLarge = true; });
    req.on('end', async () => {
      if (tooLarge) { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Body too large' })); return; }
      try {
        const { videoId, imageData, title } = JSON.parse(body);
        const imagesDir = join(__dirname, 'images');
        await mkdir(imagesDir, { recursive: true });
        const safeName = (title || videoId || 'cover').replace(/[<>:"/\\|?*]/g, '_').slice(0, 60);
        const date = new Date().toISOString().slice(0, 10);
        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(.*?);base64,(.*)$/);
        if (!base64Match) throw new Error('Invalid image data');
        const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
        const filename = `${date}_${safeName}.${ext}`;
        await writeFile(join(imagesDir, filename), Buffer.from(base64Match[2], 'base64'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ filename }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Save blog post to file
  if (url.pathname === '/api/save-post' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { title, content, videoId, channel } = JSON.parse(body);
        if (!content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing content' }));
          return;
        }
        const postsDir = join(__dirname, 'posts');
        await mkdir(postsDir, { recursive: true });
        const date = new Date().toISOString().slice(0, 10);
        const safeName = (title || videoId || 'untitled').replace(/[<>:"/\\|?*]/g, '_').slice(0, 80);
        const filename = `${date}_${safeName}.md`;
        const filepath = join(postsDir, filename);
        const header = `---\ntitle: "${(title || '').replace(/"/g, '\\"')}"\nchannel: "${(channel || '').replace(/"/g, '\\"')}"\nvideo_id: "${videoId || ''}"\ndate: "${new Date().toISOString()}"\n---\n\n`;
        await writeFile(filepath, header + content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ filename, path: filepath }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // List saved posts
  if (url.pathname === '/api/posts' && req.method === 'GET') {
    try {
      const postsDir = join(__dirname, 'posts');
      await mkdir(postsDir, { recursive: true });
      const files = await readdir(postsDir);
      const posts = [];
      for (const f of files.filter(f => f.endsWith('.md')).sort().reverse()) {
        const content = await readFile(join(postsDir, f), 'utf8');
        // Parse frontmatter
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        let meta = {};
        if (fmMatch) {
          for (const line of fmMatch[1].split('\n')) {
            const [k, ...v] = line.split(': ');
            if (k) meta[k.trim()] = v.join(': ').replace(/^"|"$/g, '');
          }
        }
        posts.push({ filename: f, ...meta });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(posts));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Delete a saved post
  if (url.pathname.startsWith('/api/posts/') && req.method === 'DELETE') {
    const filename = decodeURIComponent(url.pathname.slice('/api/posts/'.length)).replace(/[/\\]/g, '');
    try {
      await unlink(join(__dirname, 'posts', filename));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Read a saved post
  if (url.pathname.startsWith('/api/posts/') && req.method === 'GET') {
    const filename = decodeURIComponent(url.pathname.slice('/api/posts/'.length)).replace(/[/\\]/g, '');
    try {
      const content = await readFile(join(__dirname, 'posts', filename), 'utf8');
      // Strip frontmatter
      const body = content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(body);
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Post not found' }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}).listen(PORT, () => {
  console.log(`YouTube RSS Reader running at http://localhost:${PORT}`);
});
