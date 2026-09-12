import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildNotesData } from './scripts/sync-notes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Load & sync notes data into memory
let notesData: any[] = [];
try {
  notesData = buildNotesData();
} catch (e) {
  console.error('buildNotesData failed on startup, loading existing notes-data.json:', e);
  try {
    const jsonPath = path.join(__dirname, 'notes-data.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      notesData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading notes-data.json:', err);
  }
}

if (!notesData || notesData.length === 0) {
  try {
    const jsPath = path.join(__dirname, 'notes-data.js');
    if (fs.existsSync(jsPath)) {
      const jsRaw = fs.readFileSync(jsPath, 'utf8');
      const cleanJson = jsRaw.replace(/^window\.__FALLBACK_NOTES_DATA__\s*=\s*/, '').replace(/;\s*$/, '');
      notesData = JSON.parse(cleanJson);
    }
  } catch (err) {
    console.error('Error loading fallback notes-data.js:', err);
  }
}

// Endpoint to force re-sync notes without restarting
app.post('/api/sync-notes', (_req, res) => {
  try {
    notesData = buildNotesData();
    res.json({ success: true, count: notesData.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint for resource notifications / changelog
app.get('/api/notifications', (_req, res) => {
  try {
    const notifPath = path.join(__dirname, 'notifications.json');
    let batches = [];
    if (fs.existsSync(notifPath)) {
      const raw = fs.readFileSync(notifPath, 'utf8');
      const parsed = JSON.parse(raw);
      batches = Array.isArray(parsed) ? parsed : (parsed.recentBatches || parsed.updates || []);
    }
    const totalCount = notesData?.length || 850;
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      totalResourcesTracked: totalCount,
      recentBatches: batches,
      updates: batches
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, recentBatches: [], updates: [] });
  }
});

// API endpoint for notes
app.get('/api/notes', (req, res) => {
  const { stream, subject, category, tag, q } = req.query;
  let results = notesData;

  if (stream && typeof stream === 'string' && stream !== 'All') {
    results = results.filter(n => Array.isArray(n.streams) && n.streams.some((s: string) => s.toLowerCase() === stream.toLowerCase()));
  }
  if (subject && typeof subject === 'string' && subject !== 'All') {
    results = results.filter(n => n.subject.toLowerCase() === subject.toLowerCase());
  }
  if (category && typeof category === 'string' && category !== 'All') {
    results = results.filter(n => n.category.toLowerCase() === category.toLowerCase());
  }
  if (tag && typeof tag === 'string' && tag !== 'All') {
    results = results.filter(n => n.tag.toLowerCase() === tag.toLowerCase());
  }
  if (q && typeof q === 'string' && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.subject.toLowerCase().includes(query) ||
      n.category.toLowerCase().includes(query) ||
      (n.tag && n.tag.toLowerCase().includes(query))
    );
  }

  res.json({
    total: results.length,
    notes: results
  });
});

// Routes - serve main application index.html for notes & workspace routes
app.get(['/notes', '/workspace'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Favicon aliases
app.get(['/favicon-for-light.svg', '/favicon-for-dark.svg'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.svg'));
});

// SEO routes
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Fallback endpoints for Vercel Analytics and Speed Insights in non-Vercel dev environments
// (On Vercel, these routes are intercepted and served by Vercel edge infrastructure)
app.get(['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'], (_req, res) => {
  res.type('application/javascript').send(`
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
  `);
});

app.post(['/_vercel/insights/view', '/_vercel/insights/event', '/_vercel/speed-insights/vitals'], (_req, res) => {
  res.status(204).end();
});

// Static assets
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Guard: For missing asset files (JS, CSS, images, etc.), return 404 instead of HTML
app.use((req, res, next) => {
  if (/\.(js|css|json|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/i.test(req.path)) {
    return res.status(404).send('Asset not found');
  }
  next();
});

// Catch-all route to serve index.html for ISC.exe 2.0 Notes Hub
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ISC.exe 2.0 Notes Hub server listening on port ${PORT}`);
});

