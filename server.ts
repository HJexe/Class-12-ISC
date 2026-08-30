import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Load notes data into memory
let notesData: any[] = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'notes-data.json'), 'utf8');
  notesData = JSON.parse(raw);
} catch (e) {
  console.error('Error loading notes-data.json:', e);
}

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

// Routes
app.get(['/notes', '/notes.html', '/workspace'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'notes.html'));
});

// Favicon aliases
app.get(['/favicon-for-light.svg', '/favicon-for-dark.svg'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.svg'));
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

