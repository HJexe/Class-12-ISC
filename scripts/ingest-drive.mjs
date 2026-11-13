#!/usr/bin/env node
/**
 * Owner Notes Ingestion & Drive Directory Normalizer CLI
 * Used by .github/workflows/add-notes.yml (GitHub Actions workflow_dispatch)
 *
 * Features:
 * - Zero-key Drive folder scraping (embeddedfolderview) & file title detection (og:title)
 * - Optional Google Drive API v3 recursive fetch when GOOGLE_DRIVE_API_KEY is configured
 * - Path sanitization (strips Root/, leading slashes, numbering prefixes)
 * - Smart chronological sorting with Roman numeral support (I..XXX)
 * - Prefix-based Auto-Clustering into Title-Cased virtual subfolders
 * - Non-destructive Drive-ID deduplicated append into <Subject>/text
 * - Automatic rebuild of files.json, notes-data.(json|js), and notifications.(json|js)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildNotesData, SUBJECT_STREAMS } from './sync-notes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ROMAN_MAP = {
  I: 1, II: 2, III: 3, IV: 4, V: 5,
  VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15,
  XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20,
  XXI: 21, XXII: 22, XXIII: 23, XXIV: 24, XXV: 25,
  XXVI: 26, XXVII: 27, XXVIII: 28, XXIX: 29, XXX: 30
};

const SUBJECT_KEYWORDS = {
  'Accounts': [
    'accountancy', 'accounts', 'partnership', 'goodwill', 'debenture', 'debentures',
    'cash flow', 'ratio analysis', 'comparative statement', 'common size', 'forfeiture',
    'reissue', 'balance sheet', 'journal', 'ledger', 'dissolution', 'admission of a partner',
    'retirement', 'company accounts', 'ts grewal', 'dk goel', 'an aid to accountancy'
  ],
  'Economics': [
    'economics', 'microeconomics', 'macroeconomics', 'elasticity', 'demand', 'supply',
    'consumer equilibrium', 'indifference curve', 'market mechanism', 'national income',
    'keynes', 'income and employment', 'propensity', 'multiplier', 'fiscal policy',
    'monetary policy', 'central bank', 'commercial bank', 'balance of payments', 'public finance',
    'producer equilibrium', 'cost and revenue', 'frank isc economics'
  ],
  'Commerce': [
    'commerce', 'business environment', 'financing', 'joint stock', 'banking', 'management',
    'principles of management', 'planning', 'organising', 'staffing', 'directing', 'controlling',
    'coordination', 'marketing', 'consumer protection', 'fayol', 'taylor', 'capital market',
    'stock exchange', 'working capital', 'fixed capital', 'preference shares'
  ],
  'Business Studies': [
    'business studies', 'human resource', 'staff selection', 'recruitment', 'training',
    'leadership', 'motivation', 'maslow', 'herzberg', 'morale', 'business communication',
    'letter writing', 'memo', 'report writing', 'agenda', 'minutes', 'globalisation', 'outsourcing'
  ],
  'Physics': [
    'physics', 'electrostatics', 'gauss', 'capacitance', 'capacitor', 'current electricity',
    'kirchhoff', 'potentiometer', 'magnetism', 'biot savart', 'ampere', 'electromagnetic',
    'faraday', 'lenz', 'alternating current', 'lcr', 'transformer', 'optics', 'refraction',
    'huygens', 'interference', 'diffraction', 'polarisation', 'photoelectric', 'bohr',
    'nuclear', 'radioactivity', 'semiconductor', 'diode', 'transistor', 'nootan physics'
  ],
  'Chemistry': [
    'chemistry', 'solutions', 'colligative', 'raoult', 'electrochemistry', 'nernst',
    'chemical kinetics', 'arrhenius', 'surface chemistry', 'd and f block', 'transition elements',
    'coordination compounds', 'werner', 'haloalkanes', 'haloarenes', 'alcohols', 'phenols',
    'ethers', 'aldehydes', 'ketones', 'carboxylic', 'amines', 'diazonium', 'biomolecules',
    'polymers', 'organic chemistry', 'inorganic', 'physical chemistry', 'named reactions'
  ],
  'Biology': [
    'biology', 'reproduction', 'pollination', 'gametogenesis', 'menstrual', 'genetics',
    'mendel', 'dna', 'rna', 'transcription', 'translation', 'lac operon', 'evolution',
    'darwin', 'human health', 'immunity', 'aids', 'cancer', 'microbes', 'biotechnology',
    'pcr', 'plasmid', 'ecology', 'ecosystem', 'biodiversity', 'population', 'xylem', 'phloem'
  ],
  'Maths': [
    'maths', 'mathematics', 'relations and functions', 'inverse trigonometric', 'matrices',
    'determinants', 'continuity', 'differentiability', 'derivatives', 'maxima', 'minima',
    'integrals', 'integration', 'differential equations', 'probability', 'bayes', 'vectors',
    'three dimensional', '3d geometry', 'linear programming', 'application of calculus',
    'correlation', 'regression', 'ml aggarwal', 'op malhotra', 's chand maths'
  ],
  'Computer Science': [
    'computer science', 'boolean', 'karnaugh', 'k-map', 'logic gates', 'propositional',
    'java', 'recursion', 'inheritance', 'polymorphism', 'interface', 'data structures',
    'stack', 'queue', 'linked list', 'binary tree', 'complexity', 'big o', 'string handling',
    'arrays', 'matrix program', 'computer hardware', 'adder', 'multiplexer', 'encoder', 'decoder'
  ],
  'English': [
    'english', 'macbeth', 'shakespeare', 'prism', 'rhapsody', 'short stories', 'poetry',
    'tempest', 'echoes', 'reverie', 'directed writing', 'proposal writing', 'grammar',
    'prepositions', 'transformation of sentences', 'comprehension', 'phrasal verbs', 'essay'
  ],
  'History': [
    'history', 'indian national movement', 'gandhi', 'non-cooperation', 'civil disobedience',
    'quit india', 'partition', 'cabinet mission', 'cold war', 'world war', 'hitler', 'mussolini',
    'fascism', 'nazism', 'united nations', 'apartheid', 'middle east', 'arab-israeli', 'mao'
  ],
  'Geography': [
    'geography', 'topographical', 'map work', 'climate', 'monsoon', 'vegetation', 'population',
    'migration', 'settlement', 'agriculture', 'irrigation', 'minerals', 'industries', 'transport'
  ],
  'Psychology': [
    'psychology', 'intelligence', 'personality', 'freud', 'allport', 'attitude', 'prejudice',
    'stress', 'psychological disorders', 'schizophrenia', 'anxiety', 'counselling', 'lifespan'
  ],
  'Sociology': [
    'sociology', 'social institutions', 'kinship', 'marriage', 'family', 'religion',
    'caste', 'class', 'tribe', 'social change', 'weekly markets', 'panchayati raj', 'gender'
  ],
  'Political Science': [
    'political science', 'constitution', 'parliament', 'fundamental rights', 'judiciary',
    'federalism', 'executive', 'legislature', 'directive principles', 'sovereignty'
  ],
  'Biotechnology': [
    'biotechnology', 'recombinant', 'genetic engineering', 'fermentation', 'bioinformatics', 'proteomics'
  ],
  'Environmental Science': [
    'environmental science', 'evs', 'biodiversity conservation', 'pollution', 'sustainable development', 'biosphere'
  ]
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9'
};

function decodeHtmlEntities(str = '') {
  return String(str)
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

export function extractDriveFileId(str = '') {
  const match =
    str.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i) ||
    str.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : '';
}

export function extractDriveFolderId(str = '') {
  const match = str.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : '';
}

async function fetchDriveFileTitle(driveId) {
  try {
    const res = await fetch(`https://drive.google.com/file/d/${driveId}/view`, {
      headers: BROWSER_HEADERS,
      redirect: 'follow'
    });
    if (!res.ok) return '';
    const html = await res.text();

    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
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
  } catch {
    // Fall back safely when file metadata is unavailable
  }
  return '';
}

async function fetchDriveFolderTitle(folderId) {
  try {
    const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: BROWSER_HEADERS,
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
  } catch {
    // Ignore
  }
  return '';
}

async function scrapePublicDriveFolder(folderId, parentPath = '', depth = 0, visited = new Set()) {
  if (depth > 3 || visited.has(folderId)) return [];
  visited.add(folderId);

  const results = [];
  try {
    let currentFolderPath = parentPath;
    if (depth === 0 && !currentFolderPath) {
      const rootName = await fetchDriveFolderTitle(folderId);
      if (rootName) currentFolderPath = rootName;
    }

    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`;
    const res = await fetch(embedUrl, { headers: BROWSER_HEADERS });
    if (!res.ok) return results;
    const html = await res.text();

    const entryRegex = /<div[^>]+class=["'][^"']*flip-entry[^"']*["'][^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi;
    const subfolders = [];
    let match;

    while ((match = entryRegex.exec(html)) !== null) {
      const block = match[0];
      const titleMatch = block.match(/<div[^>]+class=["'][^"']*flip-entry-title[^"']*["'][^>]*>([^<]+)<\/div>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
      if (!title) continue;

      const fileId = extractDriveFileId(block);
      const subFolderId = extractDriveFolderId(block);

      if (fileId && !subFolderId) {
        const finalName = /\.[a-zA-Z0-9]{2,5}$/.test(title) ? title : `${title}.pdf`;
        results.push({
          driveId: fileId,
          fileName: finalName,
          folderPath: currentFolderPath,
          url: `https://drive.google.com/file/d/${fileId}/preview`
        });
      } else if (subFolderId) {
        subfolders.push({ id: subFolderId, name: title });
      }
    }

    // Anchor fallback if Google slightly changes flip-entry markup
    if (results.length === 0 && subfolders.length === 0) {
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1];
        const inner = linkMatch[2];
        const titleMatch = inner.match(/flip-entry-title[^>]*>([^<]+)</i) || inner.match(/>([^<>]{3,140})</);
        const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
        if (!title) continue;

        const subId = extractDriveFolderId(href);
        const fId = extractDriveFileId(href);
        if (subId) {
          subfolders.push({ id: subId, name: title });
        } else if (fId) {
          const finalName = /\.[a-zA-Z0-9]{2,5}$/.test(title) ? title : `${title}.pdf`;
          results.push({
            driveId: fId,
            fileName: finalName,
            folderPath: currentFolderPath,
            url: `https://drive.google.com/file/d/${fId}/preview`
          });
        }
      }
    }

    for (const sub of subfolders) {
      const nextPath = currentFolderPath ? `${currentFolderPath}/${sub.name}` : sub.name;
      const subItems = await scrapePublicDriveFolder(sub.id, nextPath, depth + 1, visited);
      results.push(...subItems);
    }
  } catch (err) {
    console.warn(`Warning scraping public folder ${folderId}:`, err.message);
  }
  return results;
}

async function fetchDriveFolderViaApi(folderId, apiKey, parentPath = '', depth = 0) {
  if (depth > 4) return [];
  const results = [];
  let pageToken = '';

  try {
    do {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType)');
      let apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${encodeURIComponent(apiKey)}`;
      if (pageToken) apiUrl += `&pageToken=${encodeURIComponent(pageToken)}`;

      const res = await fetch(apiUrl);
      if (!res.ok) return results;
      const data = await res.json();
      const files = Array.isArray(data.files) ? data.files : [];

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          const nextPath = parentPath ? `${parentPath}/${file.name}` : file.name;
          const subItems = await fetchDriveFolderViaApi(file.id, apiKey, nextPath, depth + 1);
          results.push(...subItems);
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
      pageToken = data.nextPageToken || '';
    } while (pageToken);
  } catch (err) {
    console.warn(`Warning fetching folder via API ${folderId}:`, err.message);
  }
  return results;
}

export function buildRomanChronologicalSortKey(str = '') {
  return String(str)
    .replace(/\b([IVXLCDM]{1,6}|\d+)\b/g, (match) => {
      if (/^\d+$/.test(match)) {
        return match.padStart(6, '0');
      }
      const upper = match.toUpperCase();
      if (ROMAN_MAP[upper] !== undefined) {
        return String(ROMAN_MAP[upper]).padStart(6, '0');
      }
      return match;
    })
    .toLowerCase();
}

function toTitleCase(str = '') {
  const minorWords = new Set(['of', 'and', 'in', 'to', 'for', 'on', 'with', 'a', 'an', 'the']);
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (ROMAN_MAP[word.toUpperCase()]) return word.toUpperCase();
      if (index > 0 && minorWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function getCleanWordsForClustering(fileName = '') {
  const withoutExt = String(fileName).replace(/\.[a-zA-Z0-9]{2,5}$/, '');
  const cleaned = withoutExt
    .replace(/^\d+\s*[._-]\s*/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(' ').filter(Boolean);
}

export function normalizeAndClusterEntries(rawItems, options = {}) {
  const opts = {
    romanSort: true,
    autoCluster: true,
    minSharedWords: 3,
    stripRoot: true,
    ...options
  };

  let items = rawItems.map((item) => {
    let folder = (item.folderPath || '').trim();
    let name = (item.fileName || '').trim();

    if (opts.stripRoot) {
      folder = folder.replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '').replace(/\/+$/, '');
      name = name.replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '');
    }

    if (name.includes('/')) {
      const parts = name.split('/').map((p) => p.trim()).filter(Boolean);
      name = parts[parts.length - 1];
      const prefixFolder = parts.slice(0, -1).join('/');
      folder = folder ? `${folder}/${prefixFolder}` : prefixFolder;
    }

    if (name && !/\.[a-zA-Z0-9]{2,5}$/.test(name)) {
      name += '.pdf';
    }

    return {
      ...item,
      folderPath: folder,
      fileName: name || 'Untitled_Note.pdf',
      sortKey: opts.romanSort
        ? buildRomanChronologicalSortKey(`${folder}/${name}`)
        : `${folder}/${name}`.toLowerCase()
    };
  });

  items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  if (opts.autoCluster && items.length >= 2) {
    const minWords = Math.max(2, parseInt(opts.minSharedWords, 10) || 3);
    const tokenized = items.map((it) => {
      const words = getCleanWordsForClustering(it.fileName);
      return {
        words,
        lowerWords: words.map((w) => w.toLowerCase())
      };
    });

    const assignedCluster = new Array(items.length).fill('');

    for (let i = 0; i < items.length; i++) {
      const wA = tokenized[i].lowerWords;
      if (wA.length < minWords) continue;

      let bestPrefixLen = 0;
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        if ((items[i].folderPath || '').toLowerCase() !== (items[j].folderPath || '').toLowerCase()) continue;

        const wB = tokenized[j].lowerWords;
        let k = 0;
        while (k < wA.length && k < wB.length && wA[k] === wB[k]) {
          k++;
        }
        if (k >= minWords && k > bestPrefixLen) {
          bestPrefixLen = k;
        }
      }

      if (bestPrefixLen >= minWords) {
        const rawPrefix = tokenized[i].words.slice(0, bestPrefixLen).join(' ');
        if (rawPrefix.length >= 8) {
          assignedCluster[i] = toTitleCase(rawPrefix);
        }
      }
    }

    items = items.map((it, idx) => {
      const clusterName = assignedCluster[idx];
      if (!clusterName) return it;
      const currentFolder = it.folderPath || '';
      if (currentFolder.toLowerCase().endsWith(clusterName.toLowerCase())) {
        return it;
      }
      return {
        ...it,
        virtualCluster: clusterName,
        folderPath: currentFolder ? `${currentFolder}/${clusterName}` : clusterName
      };
    });
  }

  return items.map((it) => {
    const cleanFolder = (it.folderPath || '').replace(/^\/+|\/+$/g, '');
    const fullFlatPath = cleanFolder ? `${cleanFolder}/${it.fileName}` : it.fileName;
    const finalUrl = it.driveId
      ? `https://drive.google.com/file/d/${it.driveId}/preview`
      : it.url;
    return {
      ...it,
      fullFlatPath,
      url: finalUrl,
      formattedLine: `${fullFlatPath}|${finalUrl}`
    };
  });
}

export function detectSubjectFromPath(fileName = '', folderPath = '', fallbackSubject = 'Economics') {
  const combined = `${folderPath} ${fileName}`.toLowerCase().replace(/[_-]/g, ' ');
  let detected = fallbackSubject;
  let bestScore = 0;

  for (const [subj, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        score += kw.includes(' ') ? 3 : 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      detected = subj;
    }
  }
  return detected;
}

function splitInputLines(rawInput = '') {
  const rawLines = String(rawInput)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const expanded = [];
  for (const line of rawLines) {
    if (line.includes('|')) {
      expanded.push(line);
      continue;
    }
    // Support pasting multiple URLs separated by spaces or commas on one line
    const tokens = line.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length > 1 && tokens.every((t) => /^https?:\/\//i.test(t))) {
      expanded.push(...tokens);
    } else {
      expanded.push(line);
    }
  }
  return expanded;
}

async function resolveInputLines(rawInput, apiKey) {
  const lines = splitInputLines(rawInput);
  const extracted = [];

  for (const line of lines) {
    // 1. Pre-formatted "Folder/File.pdf|URL"
    if (line.includes('|')) {
      const pipeIdx = line.lastIndexOf('|');
      const leftPart = line
        .substring(0, pipeIdx)
        .replace(/^\d+\s*\|\s*/, '')
        .replace(/^\/+/, '')
        .replace(/^Root\/+/i, '')
        .trim();
      const rightUrl = line.substring(pipeIdx + 1).trim();
      if (!rightUrl) continue;

      const driveId = extractDriveFileId(rightUrl);
      let folderPath = '';
      let fileName = leftPart;
      if (leftPart.includes('/')) {
        const parts = leftPart.split('/').map((p) => p.trim()).filter(Boolean);
        fileName = parts[parts.length - 1];
        folderPath = parts.slice(0, -1).join('/');
      }
      if (!fileName && driveId) {
        fileName = (await fetchDriveFileTitle(driveId)) || `Document_${driveId.substring(0, 6)}.pdf`;
      }
      if (fileName && !/\.[a-zA-Z0-9]{2,5}$/.test(fileName)) {
        fileName += '.pdf';
      }
      extracted.push({
        driveId,
        fileName: fileName || 'Untitled_Note.pdf',
        folderPath,
        url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rightUrl
      });
      continue;
    }

    // 2. Google Drive Folder URL
    const folderId = extractDriveFolderId(line);
    if (folderId) {
      let folderItems = [];
      if (apiKey) {
        const rootTitle = await fetchDriveFolderTitle(folderId);
        folderItems = await fetchDriveFolderViaApi(folderId, apiKey, rootTitle);
      }
      if (folderItems.length === 0) {
        folderItems = await scrapePublicDriveFolder(folderId);
      }
      console.log(`📁 Folder ${folderId}: discovered ${folderItems.length} item(s)`);
      extracted.push(...folderItems);
      continue;
    }

    // 3. Individual Google Drive File URL
    const fileId = extractDriveFileId(line);
    if (fileId) {
      let title = await fetchDriveFileTitle(fileId);
      if (!title) {
        title = `ISC_Resource_${fileId.substring(0, 6)}.pdf`;
      } else if (!/\.[a-zA-Z0-9]{2,5}$/.test(title)) {
        title += '.pdf';
      }
      console.log(`📄 File ${fileId}: resolved as "${title}"`);
      extracted.push({
        driveId: fileId,
        fileName: title,
        folderPath: '',
        url: `https://drive.google.com/file/d/${fileId}/preview`
      });
    }
  }

  return extracted;
}

function getTargetTextFile(subject) {
  if (subject === 'Chemistry' && fs.existsSync(path.join(rootDir, 'Chemistry/text.'))) {
    return 'Chemistry/text.';
  }
  return `${subject}/text`;
}

function cleanFolderPrefix(folderPath, subject, baseCategory) {
  let parts = String(folderPath || '')
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  // Strip redundant root folder name if it matches the target subject
  if (parts.length > 0 && parts[0].toLowerCase() === subject.toLowerCase()) {
    parts = parts.slice(1);
  }

  const cleanBase = String(baseCategory || '').trim().replace(/^\/+|\/+$/g, '');
  if (cleanBase && cleanBase !== 'Chapter Notes' && cleanBase !== 'General Notes') {
    const baseLower = cleanBase.toLowerCase();
    if (parts.length === 0 || parts[0].toLowerCase() !== baseLower) {
      parts = [cleanBase, ...parts];
    }
  }

  return parts.join('/');
}

async function runCli() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : '';
  };

  const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const rawLinks = getArg('--links') || process.env.DRIVE_LINKS || '';
  const requestedSubject = (getArg('--subject') || process.env.SUBJECT || 'Auto-Detect').trim();
  const baseCategory = (getArg('--category') || process.env.CATEGORY || '').trim();
  const romanSort = (getArg('--roman-sort') || process.env.ROMAN_SORT || 'true') !== 'false';
  const autoCluster = (getArg('--auto-cluster') || process.env.AUTO_CLUSTER || 'true') !== 'false';
  const minSharedWords = parseInt(getArg('--min-words') || process.env.MIN_SHARED_WORDS || '3', 10) || 3;
  const apiKey = (process.env.GOOGLE_DRIVE_API_KEY || process.env.DRIVE_API_KEY || '').trim();

  if (!rawLinks.trim()) {
    console.error('❌ No DRIVE_LINKS input provided.');
    process.exit(1);
  }

  console.log(`🔎 Parsing Drive links (subject=${requestedSubject}, romanSort=${romanSort}, autoCluster=${autoCluster}, dryRun=${dryRun})...`);
  const discovered = await resolveInputLines(rawLinks, apiKey);

  if (discovered.length === 0) {
    console.warn('⚠️ No valid Drive files or Path|URL entries could be extracted from the supplied links.');
    return;
  }

  const normalized = normalizeAndClusterEntries(discovered, {
    romanSort,
    autoCluster,
    minSharedWords,
    stripRoot: true
  });

  // Group normalized entries by target <Subject>/text
  const groupedByFile = new Map();
  for (const item of normalized) {
    const subject =
      requestedSubject && requestedSubject !== 'Auto-Detect'
        ? requestedSubject
        : detectSubjectFromPath(item.fileName, item.folderPath, 'Economics');

    if (!SUBJECT_STREAMS[subject]) {
      SUBJECT_STREAMS[subject] = ['Commerce'];
    }

    const finalFolder = cleanFolderPrefix(item.folderPath, subject, baseCategory);
    const entryPath = finalFolder ? `${finalFolder}/${item.fileName}` : item.fileName;
    const formattedLine = `${entryPath}|${item.url}`;
    const targetRelPath = getTargetTextFile(subject);

    if (!groupedByFile.has(targetRelPath)) {
      groupedByFile.set(targetRelPath, []);
    }
    groupedByFile.get(targetRelPath).push({
      line: formattedLine,
      driveId: item.driveId,
      url: item.url
    });
  }

  let totalAdded = 0;
  let totalSkippedDup = 0;

  for (const [relPath, entries] of groupedByFile.entries()) {
    const fullPath = path.join(rootDir, relPath);
    const existingContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    const existingLines = existingContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const existingDriveIds = new Set();
    const existingUrls = new Set();
    for (const line of existingLines) {
      const id = extractDriveFileId(line);
      if (id) existingDriveIds.add(id);
      const pipeIdx = line.lastIndexOf('|');
      if (pipeIdx !== -1) {
        existingUrls.add(line.substring(pipeIdx + 1).trim());
      }
    }

    const toAppend = [];
    for (const entry of entries) {
      if ((entry.driveId && existingDriveIds.has(entry.driveId)) || existingUrls.has(entry.url)) {
        totalSkippedDup++;
        continue;
      }
      if (entry.driveId) existingDriveIds.add(entry.driveId);
      existingUrls.add(entry.url);
      toAppend.push(entry.line);
    }

    if (toAppend.length > 0) {
      console.log(`📝 ${relPath}: +${toAppend.length} new line(s)${dryRun ? ' [DRY RUN]' : ''}`);
      if (dryRun) {
        toAppend.forEach((l) => console.log(`   + ${l}`));
      } else {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        const nextText = [...existingLines, ...toAppend].join('\n') + '\n';
        fs.writeFileSync(fullPath, nextText, 'utf8');
      }
      totalAdded += toAppend.length;
    } else {
      console.log(`ℹ️ ${relPath}: all ${entries.length} discovered item(s) already indexed.`);
    }
  }

  console.log(`📊 Summary: ${totalAdded} added, ${totalSkippedDup} duplicate(s) skipped.`);

  if (!dryRun && totalAdded > 0) {
    buildNotesData();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch((err) => {
    console.error('❌ Drive ingestion failed:', err);
    process.exit(1);
  });
}
