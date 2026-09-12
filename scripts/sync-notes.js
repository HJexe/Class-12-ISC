import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUBJECT_STREAMS = {
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
  'History': ['Humanities', 'All Streams']
};

// Standard raw file order
const RAW_FILES = [
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

export function buildNotesData() {
  console.log('🔄 Syncing study notes data from subject text files...');

  // 1. Load existing notes to preserve existing IDs & bookmarks
  const jsonPath = path.join(rootDir, 'notes-data.json');
  const jsPath = path.join(rootDir, 'notes-data.js');

  const existingByUrl = new Map();
  let maxIdNum = 0;

  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(existing)) {
        existing.forEach(n => {
          if (n.url) existingByUrl.set(n.url.trim(), n);
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

  const allNotes = [];
  const assignedIds = new Set();

  for (const rawRelPath of RAW_FILES) {
    const fullTextPath = path.join(rootDir, rawRelPath);
    if (!fs.existsSync(fullTextPath)) {
      console.warn(`⚠️ Warning: Missing text file at ${rawRelPath}`);
      continue;
    }

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

      const pipeIdx = trimmed.indexOf('|');
      let filePathPart = trimmed.substring(0, pipeIdx).trim();
      const url = trimmed.substring(pipeIdx + 1).trim();

      // Normalize: strip accidental leading slashes
      filePathPart = filePathPart.replace(/^\/+/, '');

      // Extract Google Drive ID
      const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const driveId = driveMatch ? driveMatch[1] : '';
      const previewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : url;
      const downloadUrl = driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : url;

      // Extract Category & FullFileName
      let category = defaultCategory;
      let fullFileName = filePathPart;
      if (filePathPart.includes('/')) {
        const parts = filePathPart.split('/');
        fullFileName = parts[parts.length - 1].trim();
        category = parts.slice(0, -1).map(p => p.trim()).join(' / ');
      }

      // Title & FileType
      const extMatch = fullFileName.match(/\.([a-zA-Z0-9]+)$/);
      let ext = extMatch ? extMatch[1].toUpperCase() : 'PDF';
      if (ext === 'DOCX') ext = 'DOC';
      const title = extMatch ? fullFileName.substring(0, fullFileName.length - extMatch[0].length).trim() : fullFileName;

      // Tag derivation
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
        checkText.includes('summary')
      ) {
        tag = 'Quick Revision';
      }

      // Check if existing note can donate its ID & tag
      const existing = existingByUrl.get(url);
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
  const econCount = allNotes.filter(n => n.subject === 'Economics').length;
  console.log(`📊 Economics notes count: ${econCount}`);

  return allNotes;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildNotesData();
}
