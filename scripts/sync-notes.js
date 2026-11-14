import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const SUBJECT_STREAMS = {
  'Accounts': ['Commerce'],
  'Biology': ['Science'],
  'Business Studies': ['Commerce'],
  'Chemistry': ['Science'],
  'Commerce': ['Commerce'],
  'Computer Science': ['Science'],
  'Economics': ['Commerce', 'Humanities'],
  'English': ['Commerce', 'Science', 'Humanities'],
  'Geography': ['Humanities'],
  'Maths': ['Commerce', 'Science'],
  'Physics': ['Science'],
  'Psychology': ['Humanities'],
  'Sociology': ['Humanities'],
  'History': ['Humanities', 'All Streams'],
  'Political Science': ['Humanities'],
  'Biotechnology': ['Science'],
  'Environmental Science': ['Science', 'Humanities', 'Commerce']
};

// Standard raw file order baseline
const DEFAULT_RAW_FILES = [
  'Accounts/Worksheets/text',
  'Accounts/text',
  'Biology/text',
  'Business Studies/text',
  'Chemistry/text.',
  'Commerce/text',
  'Computer Science/Miscellaneous/text',
  'Computer Science/Papers/text',
  'Computer Science/Revision Notes /text',
  'Computer Science/text',
  'Economics/Official ISC/text',
  'Economics/text',
  'English/text',
  'Geography/Notes/text',
  'Geography/Papers/text',
  'Maths/text',
  'Physics/text',
  'Psychology/text',
  'Sociology/text',
  'History/text'
];

export function discoverRawFiles() {
  const discovered = new Set(DEFAULT_RAW_FILES);
  const filesJsonPath = path.join(rootDir, 'files.json');

  if (fs.existsSync(filesJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filesJsonPath, 'utf8'));
      if (Array.isArray(parsed)) {
        parsed.forEach(rel => {
          if (typeof rel === 'string' && (rel.endsWith('/text') || rel.endsWith('/text.'))) {
            discovered.add(rel);
          }
        });
      }
    } catch (e) {
      console.warn('Could not parse files.json:', e);
    }
  }

  // Also scan subject directories for any new text index files
  for (const subject of Object.keys(SUBJECT_STREAMS)) {
    const subjDir = path.join(rootDir, subject);
    if (!fs.existsSync(subjDir) || !fs.statSync(subjDir).isDirectory()) continue;

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name === 'text' || entry.name === 'text.') {
          const rel = path.relative(rootDir, full).replace(/\\/g, '/');
          discovered.add(rel);
        }
      }
    };
    try {
      walk(subjDir);
    } catch (e) {}
  }

  // Sort so subfolder text files come before root <Subject>/text (preserving specific categories first)
  const list = Array.from(discovered).filter(rel => fs.existsSync(path.join(rootDir, rel)));
  list.sort((a, b) => {
    const subjA = a.split('/')[0];
    const subjB = b.split('/')[0];
    if (subjA !== subjB) return subjA.localeCompare(subjB);
    const depthA = a.split('/').length;
    const depthB = b.split('/').length;
    if (depthA !== depthB) return depthB - depthA;
    return a.localeCompare(b);
  });

  // Update files.json cleanly
  try {
    const sortedForFilesJson = [...list].sort((a, b) => a.localeCompare(b));
    fs.writeFileSync(filesJsonPath, JSON.stringify(sortedForFilesJson, null, 2) + '\n', 'utf8');
  } catch (e) {}

  return list;
}

export function deriveNoteTag(category, title, fullFileName) {
  let tag = 'Study Notes';
  const checkText = `${category} ${title} ${fullFileName}`.toLowerCase();
  if (checkText.includes('syllabus') || checkText.includes('pupil analysis')) {
    tag = 'Official Syllabus';
  } else if (
    checkText.includes('cfq') ||
    checkText.includes('worksheet') ||
    checkText.includes('wkst') ||
    checkText.includes('ws') ||
    checkText.includes('practice') ||
    checkText.includes('hots') ||
    checkText.includes('mcq') ||
    checkText.includes('question bank') ||
    checkText.includes('qb')
  ) {
    tag = 'Practice / CFQ';
  } else if (
    checkText.includes('pyq') ||
    checkText.includes('sample') ||
    checkText.includes('spq') ||
    checkText.includes('paper') ||
    checkText.includes('prelim') ||
    checkText.includes('10yrs') ||
    checkText.includes('10 years') ||
    checkText.includes('specimen')
  ) {
    tag = 'PYQ / Specimen';
  } else if (
    checkText.includes('quick') ||
    checkText.includes('formula') ||
    checkText.includes('cheat sheet') ||
    checkText.includes('summary') ||
    checkText.includes('booster')
  ) {
    tag = 'Quick Revision';
  }
  return tag;
}

export function buildNotesData() {
  console.log('🔄 Syncing study notes data from subject text files...');

  const jsonPath = path.join(rootDir, 'notes-data.json');
  const jsPath = path.join(rootDir, 'notes-data.js');

  const existingByUrl = new Map();
  const existingByDriveId = new Map();
  let maxIdNum = 0;

  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(existing)) {
        existing.forEach(n => {
          if (n.url) existingByUrl.set(n.url.trim(), n);
          if (n.driveId) existingByDriveId.set(n.driveId.trim(), n);
          if (n.id) {
            const match = n.id.match(/^isc-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxIdNum) maxIdNum = num;
            }
          }
        });
      }
    } catch (e) {
      console.warn('Could not read existing notes-data.json:', e);
    }
  }

  const rawFilesList = discoverRawFiles();
  const allNotes = [];
  const assignedIds = new Set();
  const seenSubjectDriveKey = new Set();

  for (const rawRelPath of rawFilesList) {
    const fullTextPath = path.join(rootDir, rawRelPath);
    if (!fs.existsSync(fullTextPath)) continue;

    const subject = rawRelPath.split('/')[0].trim();
    const streams = SUBJECT_STREAMS[subject] || ['Commerce'];

    // Subfolder fallback category (e.g. Accounts/Worksheets/text -> Worksheets)
    const rawParts = rawRelPath.split('/');
    let defaultCategory = 'Chapter Notes';
    if (rawParts.length > 2) {
      defaultCategory = rawParts[1].trim();
    }

    const content = fs.readFileSync(fullTextPath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('|')) continue;

      // Support both "Path/File.pdf|URL" and numbered "1| Path/File.pdf|URL"
      const pipeIdx = trimmed.lastIndexOf('|');
      let filePathPart = trimmed.substring(0, pipeIdx).trim();
      const url = trimmed.substring(pipeIdx + 1).trim();
      if (!url || !url.startsWith('http')) continue;

      // Strip optional leading line number ("1| ") and leading slashes or "Root/"
      filePathPart = filePathPart
        .replace(/^\d+\s*\|\s*/, '')
        .replace(/^\/+/, '')
        .replace(/^Root\/+/i, '')
        .trim();

      if (!filePathPart) continue;

      // Extract Google Drive ID
      const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const driveId = driveMatch ? driveMatch[1] : '';
      const previewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : url;
      const downloadUrl = driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : url;

      // Avoid duplicate entry within the same subject if listed in both a chapter subfolder text and root subject text
      const dedupKey = `${subject}::${driveId || url}`;
      if (seenSubjectDriveKey.has(dedupKey)) continue;
      seenSubjectDriveKey.add(dedupKey);

      // Extract Category & FullFileName
      let category = defaultCategory;
      let fullFileName = filePathPart;
      if (filePathPart.includes('/')) {
        const parts = filePathPart.split('/').map(p => p.trim()).filter(Boolean);
        fullFileName = parts[parts.length - 1];
        const folderParts = parts.slice(0, -1);
        // Preserve Reddit-style 'u/<username>' prefix as a single subfolder segment
        const normalizedFolders = [];
        for (let i = 0; i < folderParts.length; i++) {
          if (folderParts[i].toLowerCase() === 'u' && i + 1 < folderParts.length) {
            normalizedFolders.push(`u/${folderParts[i + 1]}`);
            i++;
          } else {
            normalizedFolders.push(folderParts[i]);
          }
        }
        // Deduplicate consecutive identical folder names (e.g. "Company Accounts/Company Accounts")
        const cleanFolders = normalizedFolders.filter((folder, idx) => idx === 0 || folder.toLowerCase() !== normalizedFolders[idx - 1].toLowerCase());
        if (cleanFolders.length > 0) {
          category = cleanFolders.join(' / ');
        }
      }

      // Title & FileType
      const extMatch = fullFileName.match(/\.([a-zA-Z0-9]+)$/);
      let ext = extMatch ? extMatch[1].toUpperCase() : 'PDF';
      if (ext === 'DOCX') ext = 'DOC';
      const title = extMatch ? fullFileName.substring(0, fullFileName.length - extMatch[0].length).trim() : fullFileName;

      // Tag derivation
      let tag = deriveNoteTag(category, title, fullFileName);

      // Check if existing note can donate its ID & tag
      const existing = existingByUrl.get(url) || (driveId ? existingByDriveId.get(driveId) : null);
      let id = '';
      if (existing && existing.id && !assignedIds.has(existing.id)) {
        id = existing.id;
        if (existing.tag) tag = existing.tag;
      } else {
        maxIdNum++;
        id = `isc-${maxIdNum}`;
      }
      assignedIds.add(id);

      allNotes.push({
        id,
        subject,
        category,
        title,
        fullFileName,
        rawPath: rawRelPath,
        fileType: ext,
        tag,
        url,
        previewUrl,
        downloadUrl,
        driveId,
        streams
      });
    }
  }

  // Write JSON
  fs.writeFileSync(jsonPath, JSON.stringify(allNotes, null, 2), 'utf8');

  // Write JS Fallback
  const jsContent = `window.__FALLBACK_NOTES_DATA__ = ${JSON.stringify(allNotes, null, 2)};\n`;
  fs.writeFileSync(jsPath, jsContent, 'utf8');

  console.log(`✅ Successfully compiled ${allNotes.length} notes!`);

  // Track & Sync Notifications Changelog
  syncNotificationsHistory(allNotes, existingByUrl, existingByDriveId);

  return allNotes;
}

function getGitCommitInfo() {
  let sha = process.env.GITHUB_SHA || '';
  let branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : '';
  let message = process.env.GITHUB_COMMIT_MESSAGE || '';

  return {
    sha: sha || 'push-latest',
    shortSha: sha ? sha.substring(0, 7) : 'push',
    branch: branch || 'main',
    message: message || 'Update study resources index'
  };
}

function syncNotificationsHistory(allNotes, existingByUrl, existingByDriveId) {
  const notifJsonPath = path.join(rootDir, 'notifications.json');
  const notifJsPath = path.join(rootDir, 'notifications.js');

  let notifications = [];
  if (fs.existsSync(notifJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(notifJsonPath, 'utf8'));
      if (Array.isArray(parsed)) {
        notifications = parsed;
      }
    } catch (err) {
      console.warn('Could not read notifications.json:', err);
    }
  }

  // Find newly added notes compared to previous notes-data.json
  const newlyAdded = allNotes.filter(n => {
    const hasUrl = existingByUrl.has(n.url.trim());
    const hasDrive = n.driveId && existingByDriveId && existingByDriveId.has(n.driveId.trim());
    return !hasUrl && !hasDrive;
  });
  const gitInfo = getGitCommitInfo();

  if (newlyAdded.length > 0) {
    const subjectsMap = new Map();
    newlyAdded.forEach(n => {
      subjectsMap.set(n.subject, (subjectsMap.get(n.subject) || 0) + 1);
    });
    const subjectBreakdown = Array.from(subjectsMap.entries()).map(([subj, count]) => `${subj} (${count})`).join(', ');

    const newBatch = {
      id: `push-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isLatest: true,
      commit: {
        sha: gitInfo.sha,
        shortSha: gitInfo.shortSha,
        branch: gitInfo.branch,
        message: gitInfo.message
      },
      title: `${newlyAdded.length} New Resource${newlyAdded.length === 1 ? '' : 's'} Added`,
      summary: `Indexed ${newlyAdded.length} new resource(s) across: ${subjectBreakdown}`,
      addedCount: newlyAdded.length,
      subjects: Array.from(subjectsMap.keys()),
      resources: newlyAdded.map(n => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        category: n.category,
        streams: n.streams,
        fileType: n.fileType,
        tag: n.tag,
        rawPath: n.rawPath,
        url: n.url,
        previewUrl: n.previewUrl,
        downloadUrl: n.downloadUrl
      }))
    };

    notifications.forEach(b => { b.isLatest = false; });
    notifications.unshift(newBatch);
  }

  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }

  fs.writeFileSync(notifJsonPath, JSON.stringify(notifications, null, 2), 'utf8');
  const notifJsContent = `window.__NOTIFICATIONS_DATA__ = ${JSON.stringify(notifications, null, 2)};\n`;
  fs.writeFileSync(notifJsPath, notifJsContent, 'utf8');

  console.log(`🔔 Notifications synced: ${notifications.length} update batches logged.`);
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildNotesData();
}
