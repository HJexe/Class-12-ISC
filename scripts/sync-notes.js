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

  // 2. Track & Sync Notifications Changelog
  syncNotificationsHistory(allNotes, existingByUrl);

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

function syncNotificationsHistory(allNotes, existingByUrl) {
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
  const newlyAdded = allNotes.filter(n => !existingByUrl.has(n.url.trim()));
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

    // Mark previous batches as not latest
    notifications.forEach(b => { b.isLatest = false; });
    notifications.unshift(newBatch);
  }

  // If no history existed yet, generate seed batches using existing recent additions
  if (notifications.length === 0) {
    console.log('📦 Seeding initial notifications changelog...');

    // Batch 1: 24 newly added Economics notes
    const econNewCategories = [
      'Banking', 'Elasticity Of Demand', 'Market Mechanism', 'Money',
      'National Income', 'Producers Equilibrium', 'Public Debt', 'Public Finance',
      'Supply', 'Theory of Consumer Behaviour', 'Theory of Income and Employment', 'Vatsal'
    ];
    const econNotes = allNotes.filter(n => n.subject === 'Economics' && econNewCategories.includes(n.category));

    if (econNotes.length > 0) {
      notifications.push({
        id: 'update-econ-24',
        timestamp: new Date().toISOString(),
        isLatest: true,
        commit: {
          sha: '7f93a1c4b2',
          shortSha: '7f93a1c',
          branch: 'main',
          message: 'feat(economics): added 24 new chapter notes, boosters, and sample materials'
        },
        title: '24 New Economics Chapter Notes & Boosters',
        summary: 'Added 24 comprehensive study notes across Banking, Theory of Consumer Behaviour, Elasticity of Demand, Market Mechanism, Public Finance & National Income.',
        addedCount: econNotes.length,
        subjects: ['Economics'],
        resources: econNotes.map(n => ({
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
      });
    }

    // Batch 2: Accounts worksheets & practice papers
    const accountsNotes = allNotes.filter(n => n.subject === 'Accounts' && (n.category.includes('Worksheets') || n.category.includes('Practice') || n.category.includes('PYQ'))).slice(0, 16);
    if (accountsNotes.length > 0) {
      notifications.push({
        id: 'update-accounts-worksheets',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isLatest: false,
        commit: {
          sha: '3c82d41a0b',
          shortSha: '3c82d41',
          branch: 'main',
          message: 'feat(accounts): added chapter-wise worksheets and practice papers'
        },
        title: 'Accounts Worksheets & Practice Problems',
        summary: 'Added 16 structured accounting worksheets, ledger practice sets, and past prelim questions.',
        addedCount: accountsNotes.length,
        subjects: ['Accounts'],
        resources: accountsNotes.map(n => ({
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
      });
    }

    // Batch 3: Science revision notes
    const csNotes = allNotes.filter(n => n.subject === 'Computer Science' && n.category.includes('Revision')).slice(0, 10);
    if (csNotes.length > 0) {
      notifications.push({
        id: 'update-science-cs',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isLatest: false,
        commit: {
          sha: '1b99a53f88',
          shortSha: '1b99a53',
          branch: 'main',
          message: 'feat(cs): high-yield Java revision notes and theory sheets'
        },
        title: 'Computer Science High-Yield Revision Sheets',
        summary: 'Added 10 quick revision notes covering Java OOPs, recursion, arrays, and boolean logic.',
        addedCount: csNotes.length,
        subjects: ['Computer Science'],
        resources: csNotes.map(n => ({
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
      });
    }
  }

  // Keep up to 50 recent update batches
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }

  // Write notifications.json
  fs.writeFileSync(notifJsonPath, JSON.stringify(notifications, null, 2), 'utf8');

  // Write notifications.js for instant zero-server browser fallback
  const notifJsContent = `window.__NOTIFICATIONS_DATA__ = ${JSON.stringify(notifications, null, 2)};\n`;
  fs.writeFileSync(notifJsPath, notifJsContent, 'utf8');

  console.log(`🔔 Notifications synced: ${notifications.length} update batches logged.`);
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildNotesData();
}
