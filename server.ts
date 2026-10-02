import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildNotesData, discoverRawFiles, SUBJECT_STREAMS } from './scripts/sync-notes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

// Helper: Decode HTML entities from scraped Google Drive titles
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
    .trim();
}

// Helper: Fetch a single Google Drive file's title without an API key
async function fetchDriveFileTitle(driveId: string): Promise<string> {
  try {
    const url = `https://drive.google.com/file/d/${driveId}/view`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      redirect: 'follow'
    });
    if (!res.ok) return '';
    const html = await res.text();

    const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogMatch && ogMatch[1]) {
      const clean = decodeHtmlEntities(ogMatch[1]).replace(/\s*-\s*Google Drive$/i, '').trim();
      if (clean && clean.toLowerCase() !== 'google drive' && !clean.toLowerCase().includes('sign in')) {
        return clean;
      }
    }

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const clean = decodeHtmlEntities(titleMatch[1]).replace(/\s*-\s*Google Drive$/i, '').trim();
      if (clean && clean.toLowerCase() !== 'google drive' && !clean.toLowerCase().includes('sign in')) {
        return clean;
      }
    }
  } catch (e) {
    // Ignore network error and fall back to manual title
  }
  return '';
}

// Helper: Fetch a Google Drive folder's title without an API key
async function fetchDriveFolderTitle(folderId: string): Promise<string> {
  try {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      redirect: 'follow'
    });
    if (!res.ok) return '';
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const clean = decodeHtmlEntities(titleMatch[1]).replace(/\s*-\s*Google Drive$/i, '').trim();
      if (clean && clean.toLowerCase() !== 'google drive' && !clean.toLowerCase().includes('sign in')) {
        return clean;
      }
    }
  } catch (e) {}
  return '';
}

// Helper: Scrape a public Google Drive folder via embeddedfolderview (zero API key required)
async function scrapePublicDriveFolder(
  folderId: string,
  parentPath = '',
  depth = 0,
  visited = new Set<string>()
): Promise<Array<{ driveId: string; fileName: string; folderPath: string; url: string }>> {
  if (depth > 2 || visited.has(folderId)) return [];
  visited.add(folderId);

  const results: Array<{ driveId: string; fileName: string; folderPath: string; url: string }> = [];
  try {
    let currentFolderPath = parentPath;
    if (depth === 0 && !currentFolderPath) {
      const rootName = await fetchDriveFolderTitle(folderId);
      if (rootName) currentFolderPath = rootName;
    }

    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!res.ok) return results;
    const html = await res.text();

    // Parse flip-entry blocks in embeddedfolderview
    const entryRegex = /<div[^>]+class=["'][^"']*flip-entry[^"']*["'][^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi;
    const subfoldersToVisit: Array<{ id: string; name: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(html)) !== null) {
      const block = match[0];
      const titleMatch = block.match(/<div[^>]+class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([^<]+)<\/div>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
      if (!title) continue;

      const fileIdMatch = block.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
      const folderIdMatch = block.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);

      if (fileIdMatch && fileIdMatch[1]) {
        const dId = fileIdMatch[1];
        const finalName = /\.[a-zA-Z0-9]{2,5}$/.test(title) ? title : `${title}.pdf`;
        results.push({
          driveId: dId,
          fileName: finalName,
          folderPath: currentFolderPath,
          url: `https://drive.google.com/file/d/${dId}/preview`
        });
      } else if (folderIdMatch && folderIdMatch[1]) {
        subfoldersToVisit.push({ id: folderIdMatch[1], name: title });
      }
    }

    // Fallback if flip-entry regex matched 0 but links exist in HTML
    if (results.length === 0 && subfoldersToVisit.length === 0) {
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1];
        const inner = linkMatch[2];
        const titleMatch = inner.match(/flip-entry-title[^>]*>([^<]+)</i) || inner.match(/>([^<>]{3,120})</);
        const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
        if (!title) continue;

        const fMatch = href.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
        const dMatch = href.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
        if (fMatch && fMatch[1]) {
          const finalName = /\.[a-zA-Z0-9]{2,5}$/.test(title) ? title : `${title}.pdf`;
          results.push({
            driveId: fMatch[1],
            fileName: finalName,
            folderPath: currentFolderPath,
            url: `https://drive.google.com/file/d/${fMatch[1]}/preview`
          });
        } else if (dMatch && dMatch[1]) {
          subfoldersToVisit.push({ id: dMatch[1], name: title });
        }
      }
    }

    // Recursively inspect subfolders (up to depth 2)
    for (const sub of subfoldersToVisit) {
      const nextPath = currentFolderPath ? `${currentFolderPath}/${sub.name}` : sub.name;
      const subItems = await scrapePublicDriveFolder(sub.id, nextPath, depth + 1, visited);
      results.push(...subItems);
    }
  } catch (err) {
    console.warn('Error scraping public Drive folder:', err);
  }
  return results;
}

// Helper: Fetch Drive folder via official Google Drive API v3 (when API key is provided)
async function fetchDriveFolderViaApi(
  folderId: string,
  apiKey: string,
  parentPath = '',
  depth = 0
): Promise<Array<{ driveId: string; fileName: string; folderPath: string; url: string }>> {
  if (depth > 3) return [];
  const results: Array<{ driveId: string; fileName: string; folderPath: string; url: string }> = [];
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id,name,mimeType)');
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return [];
    const data: any = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];

    for (const file of files) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const nextPath = parentPath ? `${parentPath}/${file.name}` : file.name;
        const subResults = await fetchDriveFolderViaApi(file.id, apiKey, nextPath, depth + 1);
        results.push(...subResults);
      } else {
        const finalName = /\.[a-zA-Z0-9]{2,5}$/.test(file.name) ? file.name : `${file.name}.pdf`;
        results.push({
          driveId: file.id,
          fileName: finalName,
          folderPath: parentPath,
          url: `https://drive.google.com/file/d/${file.id}/preview`
        });
      }
    }
  } catch (e) {}
  return results;
}

// Verify Admin credentials (GitHub PAT or ADMIN_PASSKEY)
app.post('/api/admin/verify', async (req, res) => {
  try {
    const { passkey, githubToken, githubRepo } = req.body || {};
    const configuredPasskey = process.env.ADMIN_PASSKEY || 'isc-owner-2026';

    if (githubToken && typeof githubToken === 'string' && githubToken.trim()) {
      const token = githubToken.trim();
      const ghRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'ISC-Resource-Hub-Admin'
        }
      });
      if (ghRes.ok) {
        const userData: any = await ghRes.json();
        return res.json({
          success: true,
          authenticated: true,
          method: 'github',
          user: userData.login,
          githubRepo: githubRepo || process.env.GITHUB_REPO || ''
        });
      }
      return res.status(401).json({ success: false, error: 'Invalid GitHub Personal Access Token' });
    }

    if (passkey && typeof passkey === 'string' && passkey.trim() === configuredPasskey) {
      return res.json({
        success: true,
        authenticated: true,
        method: 'passkey',
        user: 'Owner'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Enter your GitHub Personal Access Token or Admin Passkey.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Smart Link & Folder Auto-Recognition Endpoint (Zero API Key + Optional Drive API Key)
app.post('/api/admin/inspect-drive', async (req, res) => {
  try {
    const { input, driveApiKey } = req.body || {};
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, error: 'No input links provided' });
    }

    const effectiveApiKey = (driveApiKey && driveApiKey.trim()) || process.env.GOOGLE_DRIVE_API_KEY || '';
    const rawLines = input.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const extractedItems: Array<{ driveId: string; fileName: string; folderPath: string; url: string }> = [];

    for (const line of rawLines) {
      // Case 1: Line already has "Path/Filename|URL"
      if (line.includes('|')) {
        const pipeIdx = line.lastIndexOf('|');
        const leftPart = line.substring(0, pipeIdx).replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '').trim();
        const rightUrl = line.substring(pipeIdx + 1).trim();
        const dMatch = rightUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rightUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const driveId = dMatch ? dMatch[1] : '';

        let folderPath = '';
        let fileName = leftPart;
        if (leftPart.includes('/')) {
          const parts = leftPart.split('/').map((p: string) => p.trim()).filter(Boolean);
          fileName = parts[parts.length - 1];
          folderPath = parts.slice(0, -1).join('/');
        }
        if (!fileName && driveId) {
          fileName = (await fetchDriveFileTitle(driveId)) || `Document_${driveId.substring(0, 6)}.pdf`;
        }
        if (fileName && !/\.[a-zA-Z0-9]{2,5}$/.test(fileName)) {
          fileName += '.pdf';
        }
        extractedItems.push({
          driveId,
          fileName: fileName || 'Untitled_Note.pdf',
          folderPath,
          url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rightUrl
        });
        continue;
      }

      // Case 2: Google Drive Folder URL
      const folderMatch = line.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
      if (folderMatch && folderMatch[1]) {
        const folderId = folderMatch[1];
        let folderItems: Array<{ driveId: string; fileName: string; folderPath: string; url: string }> = [];
        if (effectiveApiKey) {
          const rootTitle = await fetchDriveFolderTitle(folderId);
          folderItems = await fetchDriveFolderViaApi(folderId, effectiveApiKey, rootTitle);
        }
        if (folderItems.length === 0) {
          folderItems = await scrapePublicDriveFolder(folderId);
        }
        extractedItems.push(...folderItems);
        continue;
      }

      // Case 3: Single Google Drive File URL (or multiple URLs on one line)
      const fileIdMatch = line.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || line.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
      if (fileIdMatch && fileIdMatch[1]) {
        const driveId = fileIdMatch[1];
        let title = await fetchDriveFileTitle(driveId);
        if (!title) {
          title = `ISC_Resource_${driveId.substring(0, 6)}.pdf`;
        } else if (!/\.[a-zA-Z0-9]{2,5}$/.test(title)) {
          title += '.pdf';
        }
        extractedItems.push({
          driveId,
          fileName: title,
          folderPath: '',
          url: `https://drive.google.com/file/d/${driveId}/preview`
        });
      }
    }

    return res.json({
      success: true,
      count: extractedItems.length,
      items: extractedItems
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Non-destructive Publish & Sync Endpoint
app.post('/api/admin/publish-notes', async (req, res) => {
  try {
    const { entries, passkey, githubToken } = req.body || {};
    const configuredPasskey = process.env.ADMIN_PASSKEY || 'isc-owner-2026';

    // Verify owner access
    let authorized = false;
    if (passkey && passkey.trim() === configuredPasskey) {
      authorized = true;
    } else if (githubToken && typeof githubToken === 'string' && githubToken.trim().length > 10) {
      authorized = true;
    }
    if (!authorized) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Owner credentials required.' });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: 'No note entries provided to publish.' });
    }

    // Group entries by target subject text file
    const updatesByFile = new Map<string, string[]>();
    for (const item of entries) {
      const subject = (item.subject || 'Economics').trim();
      if (!SUBJECT_STREAMS[subject as keyof typeof SUBJECT_STREAMS]) {
        (SUBJECT_STREAMS as any)[subject] = ['Commerce'];
      }

      // Determine target relative path (default: "<Subject>/text", or "Chemistry/text." for Chemistry)
      let targetRelPath = item.targetRawFile ? String(item.targetRawFile).trim() : `${subject}/text`;
      if (subject === 'Chemistry' && targetRelPath === 'Chemistry/text' && fs.existsSync(path.join(__dirname, 'Chemistry/text.'))) {
        targetRelPath = 'Chemistry/text.';
      }

      const category = (item.category || '').trim().replace(/^\/+|\/+$/g, '');
      let fileName = (item.fileName || item.title || 'Untitled.pdf').trim();
      if (!/\.[a-zA-Z0-9]{2,5}$/.test(fileName)) {
        fileName += '.pdf';
      }

      const rawUrl = (item.url || '').trim();
      const dMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const driveId = dMatch ? dMatch[1] : '';
      const finalUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rawUrl;
      if (!finalUrl) continue;

      const relativeEntryPath = category && category !== 'Chapter Notes' && category !== 'General Notes'
        ? `${category}/${fileName}`
        : fileName;

      const formattedLine = `${relativeEntryPath}|${finalUrl}`;
      if (!updatesByFile.has(targetRelPath)) {
        updatesByFile.set(targetRelPath, []);
      }
      updatesByFile.get(targetRelPath)!.push(formattedLine);
    }

    const updatedFilesMap: Record<string, string> = {};
    let totalAppended = 0;

    for (const [relPath, newLines] of updatesByFile.entries()) {
      const fullPath = path.join(__dirname, relPath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      let existingContent = '';
      if (fs.existsSync(fullPath)) {
        existingContent = fs.readFileSync(fullPath, 'utf8');
      }

      // Collect existing Drive IDs and URLs in this file to prevent duplicates
      const existingDriveIds = new Set<string>();
      const existingLines = existingContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const l of existingLines) {
        const m = l.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || l.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (m && m[1]) existingDriveIds.add(m[1]);
      }

      const linesToAppend: string[] = [];
      for (const nl of newLines) {
        const m = nl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || nl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const dId = m ? m[1] : '';
        if (dId && existingDriveIds.has(dId)) continue;
        if (dId) existingDriveIds.add(dId);
        linesToAppend.push(nl);
      }

      if (linesToAppend.length > 0) {
        const combined = [...existingLines, ...linesToAppend];
        const finalText = combined.join('\n') + '\n';
        fs.writeFileSync(fullPath, finalText, 'utf8');
        updatedFilesMap[relPath] = finalText;
        totalAppended += linesToAppend.length;
      } else if (existingContent) {
        updatedFilesMap[relPath] = existingContent;
      }
    }

    // Re-run buildNotesData to update files.json, notes-data.json, notes-data.js, notifications.json, notifications.js
    notesData = buildNotesData();

    for (const indexFile of ['files.json', 'notes-data.json', 'notes-data.js', 'notifications.json', 'notifications.js']) {
      const p = path.join(__dirname, indexFile);
      if (fs.existsSync(p)) {
        updatedFilesMap[indexFile] = fs.readFileSync(p, 'utf8');
      }
    }

    return res.json({
      success: true,
      appendedCount: totalAppended,
      totalNotes: notesData.length,
      notes: notesData,
      updatedFiles: updatedFilesMap
    });
  } catch (err: any) {
    console.error('Error in /api/admin/publish-notes:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

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

// SEO & AdSense routes
app.get('/ads.txt', (_req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, 'ads.txt'));
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Fallback endpoints for Vercel Analytics and Speed Insights in non-Vercel dev environments
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
