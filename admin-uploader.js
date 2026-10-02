/**
 * Owner-Only Smart Notes Uploader & Drive Directory Normalizer Studio
 * Access: #admin-upload (or #admin) URL hash OR Ctrl+Shift+U (Cmd+Shift+U)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'isc_owner_studio_auth_v1';

  const ISC_SUBJECTS = [
    'Accounts',
    'Economics',
    'Commerce',
    'Business Studies',
    'Physics',
    'Chemistry',
    'Biology',
    'Maths',
    'Computer Science',
    'English',
    'History',
    'Geography',
    'Psychology',
    'Sociology'
  ];

  const SUBJECT_STREAMS_MAP = {
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

  // Curated keyword dictionary for Smart Subject & Category Recognition
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
      'stock exchange', 'working capital', 'fixed capital', 'debenture', 'preference shares'
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
      'ethers', 'aldehydes', 'ketones', 'carboxylic', 'amines', 'iazonium', 'biomolecules',
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
      'prepositions', 'transformation of sentences', 'comprehension', 'phasal verbs', 'essay'
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
    ]
  };

  // Roman numeral lookup (I to L)
  const ROMAN_MAP = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
    'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
    'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25,
    'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30
  };

  // Studio State
  let studioState = {
    isAuthenticated: false,
    authMethod: '',
    authUser: '',
    passkey: '',
    githubToken: '',
    githubRepo: '',
    driveApiKey: '',
    rememberDevice: true,
    activeTab: 'quick', // 'quick' | 'bulk'
    defaultSubject: 'Economics',
    defaultCategory: '',
    stagingItems: [], // Array of { id, fileName, title, subject, category, tag, url, driveId, status, source }
    bulkOptions: {
      romanSort: true,
      autoCluster: true,
      minSharedWords: 3,
      stripRoot: true
    },
    bulkNormalizedLines: [],
    isBusy: false,
    statusMessage: ''
  };

  // Load saved credentials if "Remember on this device" was checked
  function loadSavedSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.passkey || parsed.githubToken)) {
        studioState.passkey = parsed.passkey || '';
        studioState.githubToken = parsed.githubToken || '';
        studioState.githubRepo = parsed.githubRepo || '';
        studioState.driveApiKey = parsed.driveApiKey || '';
        studioState.authUser = parsed.authUser || 'Owner';
        studioState.isAuthenticated = Boolean(parsed.isAuthenticated);
      }
    } catch (e) {}
  }

  function saveSession() {
    try {
      if (studioState.rememberDevice) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isAuthenticated: studioState.isAuthenticated,
          authUser: studioState.authUser,
          passkey: studioState.passkey,
          githubToken: studioState.githubToken,
          githubRepo: studioState.githubRepo,
          driveApiKey: studioState.driveApiKey
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  function logoutStudio() {
    studioState.isAuthenticated = false;
    studioState.passkey = '';
    studioState.githubToken = '';
    localStorage.removeItem(STORAGE_KEY);
    renderStudioModal();
    if (window.showToast) window.showToast('Locked Owner Studio');
  }

  // Extract Google Drive ID from any Drive URL
  function extractDriveId(urlOrLine) {
    if (!urlOrLine) return '';
    const fMatch = urlOrLine.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || urlOrLine.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    return fMatch ? fMatch[1] : '';
  }

  function extractDriveFolderId(urlOrLine) {
    if (!urlOrLine) return '';
    const m = urlOrLine.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
    return m ? m[1] : '';
  }

  // Check if a Drive ID already exists in window.allNotes
  function isDuplicateInCatalog(driveId, url) {
    const notes = window.allNotes || window.__FALLBACK_NOTES_DATA__ || [];
    if (!driveId && !url) return false;
    return notes.some(n => (driveId && n.driveId === driveId) || (url && n.url === url));
  }

  // Get existing categories for a given subject from the current catalog
  function getExistingCategoriesForSubject(subject) {
    const notes = window.allNotes || window.__FALLBACK_NOTES_DATA__ || [];
    const set = new Set();
    notes.forEach(n => {
      if (n.subject && n.subject.toLowerCase() === (subject || '').toLowerCase() && n.category) {
        set.add(n.category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // Smart ISC Subject, Category & Tag Auto-Classifier
  function autoClassifyFile(fileName, folderPath, fallbackSubject, fallbackCategory) {
    const combined = `${folderPath || ''} ${fileName || ''}`.toLowerCase().replace(/[_-]/g, ' ');
    let detectedSubject = fallbackSubject || studioState.defaultSubject || 'Economics';
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
        detectedSubject = subj;
      }
    }

    // Determine Category / Subfolder
    let detectedCategory = fallbackCategory || '';
    if (folderPath && folderPath.trim()) {
      // Clean folder path if it starts with subject name
      const parts = folderPath.split('/').map(p => p.trim()).filter(Boolean);
      const filtered = parts.filter(p => p.toLowerCase() !== detectedSubject.toLowerCase() && p.toLowerCase() !== 'root');
      if (filtered.length > 0) {
        detectedCategory = filtered.join(' / ');
      }
    }

    if (!detectedCategory) {
      // Try matching against existing categories in that subject
      const existingCats = getExistingCategoriesForSubject(detectedSubject);
      for (const cat of existingCats) {
        const cleanCat = cat.toLowerCase().replace(/^chapter\s*\d+\s*-\s*/i, '').trim();
        if (cleanCat.length >= 4 && combined.includes(cleanCat)) {
          detectedCategory = cat;
          break;
        }
      }
    }

    if (!detectedCategory) {
      detectedCategory = studioState.defaultCategory || 'Chapter Notes';
    }

    // Derive Tag
    let tag = 'Study Notes';
    if (combined.includes('syllabus') || combined.includes('pupil analysis')) {
      tag = 'Official Syllabus';
    } else if (
      combined.includes('cfq') || combined.includes('worksheet') || combined.includes('wkst') ||
      combined.includes('practice') || combined.includes('hots') || combined.includes('mcq') ||
      combined.includes('question bank')
    ) {
      tag = 'Practice / CFQ';
    } else if (
      combined.includes('pyq') || combined.includes('sample') || combined.includes('spq') ||
      combined.includes('paper') || combined.includes('prelim') || combined.includes('specimen')
    ) {
      tag = 'PYQ / Specimen';
    } else if (
      combined.includes('quick') || combined.includes('formula') || combined.includes('cheat sheet') ||
      combined.includes('summary') || combined.includes('booster')
    ) {
      tag = 'Quick Revision';
    }

    return {
      subject: detectedSubject,
      category: detectedCategory,
      tag
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SMART CHRONOLOGICAL SORT (ROMAN NUMERALS) & AUTO-CLUSTERING
  // ─────────────────────────────────────────────────────────────

  // Convert Roman numerals and numbers in a string to zero-padded sort keys
  function buildRomanChronologicalSortKey(str) {
    if (!str) return '';
    // Normalize separators to spaces for token analysis while keeping path structure
    return str.replace(/\b([IVXLCDM]{1,6}|\d+)\b/g, (match) => {
      // Check if it's an Arabic number
      if (/^\d+$/.test(match)) {
        return match.padStart(6, '0');
      }
      // Check if it's a valid Roman numeral in ROMAN_MAP
      const upper = match.toUpperCase();
      if (ROMAN_MAP[upper] !== undefined) {
        return String(ROMAN_MAP[upper]).padStart(6, '0');
      }
      return match;
    }).toLowerCase();
  }

  function toTitleCase(str) {
    return (str || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => {
        if (['of', 'and', 'in', 'to', 'for', 'on', 'with', 'a', 'an', 'the'].includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        if (ROMAN_MAP[word.toUpperCase()]) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  // Extract normalized word tokens from a filename for prefix clustering
  function getCleanWordsForClustering(fileName) {
    const withoutExt = (fileName || '').replace(/\.[a-zA-Z0-9]{2,5}$/, '');
    const cleaned = withoutExt
      .replace(/^\d+\s*[._-]\s*/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.split(' ').filter(Boolean);
  }

  // Run Path Sanitization, Roman Chronological Sort, and Prefix Auto-Clustering
  function normalizeAndClusterEntries(rawItems, options) {
    const opts = Object.assign({
      romanSort: true,
      autoCluster: true,
      minSharedWords: 3,
      stripRoot: true
    }, options || {});

    // 1. Path Sanitization
    let items = rawItems.map(item => {
      let folder = (item.folderPath || '').trim();
      let name = (item.fileName || '').trim();

      if (opts.stripRoot) {
        folder = folder.replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '').replace(/\/+$/, '');
        name = name.replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '');
      }

      if (name.includes('/')) {
        const parts = name.split('/').map(p => p.trim()).filter(Boolean);
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
        fileName: name,
        sortKey: opts.romanSort
          ? buildRomanChronologicalSortKey(`${folder}/${name}`)
          : `${folder}/${name}`.toLowerCase()
      };
    });

    // 2. Smart Chronological Sorting (Roman Numerals I, II, IX, XII)
    items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // 3. Auto-Clustering (Virtual Folders for shared filename prefixes)
    if (opts.autoCluster && items.length >= 2) {
      const minWords = Math.max(2, parseInt(opts.minSharedWords, 10) || 3);
      const tokenized = items.map(it => ({
        words: getCleanWordsForClustering(it.fileName),
        lowerWords: getCleanWordsForClustering(it.fileName).map(w => w.toLowerCase())
      }));

      // Find longest common word prefix between adjacent sorted items without existing deep subfolders
      const assignedCluster = new Array(items.length).fill('');

      for (let i = 0; i < items.length; i++) {
        const wA = tokenized[i].lowerWords;
        if (wA.length < minWords) continue;

        let bestPrefixLen = 0;
        // Check neighbors in sorted order
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
          // Avoid generic stop-words-only folders
          if (rawPrefix.length >= 8) {
            assignedCluster[i] = toTitleCase(rawPrefix);
          }
        }
      }

      items = items.map((it, idx) => {
        const clusterName = assignedCluster[idx];
        if (!clusterName) return it;
        const currentFolder = it.folderPath || '';
        // Only add virtual subfolder if not already ending with that folder name
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

    // 4. Strict Flat Formatting: Folder/Subfolder/Filename|URL
    return items.map(it => {
      const cleanFolder = (it.folderPath || '').replace(/^\/+|\/+$/g, '');
      const fullFlatPath = cleanFolder ? `${cleanFolder}/${it.fileName}` : it.fileName;
      const finalUrl = it.driveId
        ? `https://drive.google.com/file/d/${it.driveId}/preview`
        : it.url;
      return {
        ...it,
        fullFlatPath,
        formattedLine: `${fullFlatPath}|${finalUrl}`
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CLIENT-SIDE FALLBACK INSPECTOR (FOR STATIC VERCEL HOSTING)
  // ─────────────────────────────────────────────────────────────

  async function fetchTextViaCorsFallback(targetUrl) {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    ];
    for (const pUrl of proxies) {
      try {
        const res = await fetch(pUrl);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 20) return text;
        }
      } catch (e) {}
    }
    return '';
  }

  function parseEmbeddedFolderHtmlClient(html, currentFolderPath) {
    const results = [];
    const subfolders = [];
    if (!html) return { results, subfolders };

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const entries = doc.querySelectorAll('.flip-entry');
    entries.forEach(entry => {
      const titleEl = entry.querySelector('.flip-entry-title');
      const linkEl = entry.querySelector('a[href]');
      const title = titleEl ? titleEl.textContent.trim() : '';
      const href = linkEl ? linkEl.getAttribute('href') : '';
      if (!title || !href) return;

      const fMatch = href.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
      const dMatch = href.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
      if (fMatch && fMatch[1]) {
        const fileName = /\.[a-zA-Z0-9]{2,5}$/.test(title) ? title : `${title}.pdf`;
        results.push({
          driveId: fMatch[1],
          fileName,
          folderPath: currentFolderPath || '',
          url: `https://drive.google.com/file/d/${fMatch[1]}/preview`
        });
      } else if (dMatch && dMatch[1]) {
        subfolders.push({ id: dMatch[1], name: title });
      }
    });

    return { results, subfolders };
  }

  async function clientFallbackInspectLinks(rawInput, driveApiKey) {
    const lines = (rawInput || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = [];

    for (const line of lines) {
      if (line.includes('|')) {
        const pipeIdx = line.lastIndexOf('|');
        const left = line.substring(0, pipeIdx).replace(/^\d+\s*\|\s*/, '').replace(/^\/+/, '').replace(/^Root\/+/i, '').trim();
        const right = line.substring(pipeIdx + 1).trim();
        const driveId = extractDriveId(right);
        let folderPath = '';
        let fileName = left;
        if (left.includes('/')) {
          const parts = left.split('/').map(p => p.trim()).filter(Boolean);
          fileName = parts[parts.length - 1];
          folderPath = parts.slice(0, -1).join('/');
        }
        if (fileName && !/\.[a-zA-Z0-9]{2,5}$/.test(fileName)) fileName += '.pdf';
        items.push({
          driveId,
          fileName: fileName || `ISC_Note_${driveId.substring(0, 6)}.pdf`,
          folderPath,
          url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : right
        });
        continue;
      }

      const folderId = extractDriveFolderId(line);
      if (folderId) {
        // 1. If Drive API Key is provided, use official Drive API v3 directly from browser
        if (driveApiKey) {
          const fetchFolderApi = async (fId, parentPath, depth) => {
            if (depth > 3) return;
            const q = encodeURIComponent(`'${fId}' in parents and trashed = false`);
            const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=1000&key=${encodeURIComponent(driveApiKey)}`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            for (const f of (data.files || [])) {
              if (f.mimeType === 'application/vnd.google-apps.folder') {
                await fetchFolderApi(f.id, parentPath ? `${parentPath}/${f.name}` : f.name, depth + 1);
              } else {
                const fn = /\.[a-zA-Z0-9]{2,5}$/.test(f.name) ? f.name : `${f.name}.pdf`;
                items.push({
                  driveId: f.id,
                  fileName: fn,
                  folderPath: parentPath,
                  url: `https://drive.google.com/file/d/${f.id}/preview`
                });
              }
            }
          };
          await fetchFolderApi(folderId, '', 0);
          if (items.length > 0) continue;
        }

        // 2. Zero-key embeddedfolderview fallback
        const embedHtml = await fetchTextViaCorsFallback(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
        const parsed = parseEmbeddedFolderHtmlClient(embedHtml, '');
        items.push(...parsed.results);
        for (const sub of parsed.subfolders.slice(0, 8)) {
          const subHtml = await fetchTextViaCorsFallback(`https://drive.google.com/embeddedfolderview?id=${sub.id}#list`);
          const subParsed = parseEmbeddedFolderHtmlClient(subHtml, sub.name);
          items.push(...subParsed.results);
        }
        continue;
      }

      const fileId = extractDriveId(line);
      if (fileId) {
        let detectedTitle = '';
        const fileHtml = await fetchTextViaCorsFallback(`https://drive.google.com/file/d/${fileId}/view`);
        if (fileHtml) {
          const m = fileHtml.match(/<title>([^<]+)<\/title>/i);
          if (m && m[1]) {
            detectedTitle = m[1].replace(/\s*-\s*Google Drive$/i, '').trim();
          }
        }
        if (!detectedTitle || detectedTitle.toLowerCase() === 'google drive') {
          detectedTitle = `ISC_Note_${fileId.substring(0, 6)}.pdf`;
        } else if (!/\.[a-zA-Z0-9]{2,5}$/.test(detectedTitle)) {
          detectedTitle += '.pdf';
        }
        items.push({
          driveId: fileId,
          fileName: detectedTitle,
          folderPath: '',
          url: `https://drive.google.com/file/d/${fileId}/preview`
        });
      }
    }
    return items;
  }

  // ─────────────────────────────────────────────────────────────
  // GITHUB REST API DIRECT COMMITTER (FOR VERCEL AUTO-DEPLOY)
  // ─────────────────────────────────────────────────────────────

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
  }

  async function detectUserGithubRepo(token) {
    try {
      const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (!res.ok) return '';
      const repos = await res.json();
      if (!Array.isArray(repos)) return '';
      const match = repos.find(r =>
        /isc|class-12|notes/i.test(r.name) || /isc/i.test(r.description || '')
      ) || repos[0];
      return match ? match.full_name : '';
    } catch (e) {
      return '';
    }
  }

  async function commitNotesToGithub(token, repoFullName, entries) {
    if (!token || !repoFullName) {
      throw new Error('GitHub Token and Repository (owner/repo) are required to push directly to GitHub.');
    }

    // Group entries by <Subject>/text
    const bySubjectFile = {};
    entries.forEach(item => {
      const subj = (item.subject || 'Economics').trim();
      const relPath = subj === 'Chemistry' ? 'Chemistry/text.' : `${subj}/text`;
      if (!bySubjectFile[relPath]) bySubjectFile[relPath] = [];
      const cat = (item.category || '').trim().replace(/^\/+|\/+$/g, '');
      let fn = (item.fileName || item.title || 'Note.pdf').trim();
      if (!/\.[a-zA-Z0-9]{2,5}$/.test(fn)) fn += '.pdf';
      const pathPart = (cat && cat !== 'Chapter Notes' && cat !== 'General Notes') ? `${cat}/${fn}` : fn;
      const dId = item.driveId || extractDriveId(item.url);
      const finalUrl = dId ? `https://drive.google.com/file/d/${dId}/preview` : item.url;
      bySubjectFile[relPath].push({ line: `${pathPart}|${finalUrl}`, driveId: dId });
    });

    let totalCommitted = 0;

    for (const [filePath, newItems] of Object.entries(bySubjectFile)) {
      const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
      const apiUrl = `https://api.github.com/repos/${repoFullName}/contents/${encodedPath}`;

      // 1. Fetch existing file SHA and content from GitHub
      let existingContent = '';
      let existingSha = undefined;

      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
        if (fileData.content) {
          existingContent = base64ToUtf8(fileData.content);
        }
      }

      const existingLines = existingContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const existingDriveIds = new Set();
      existingLines.forEach(l => {
        const id = extractDriveId(l);
        if (id) existingDriveIds.add(id);
      });

      const toAppend = [];
      newItems.forEach(ni => {
        if (ni.driveId && existingDriveIds.has(ni.driveId)) return;
        if (ni.driveId) existingDriveIds.add(ni.driveId);
        toAppend.push(ni.line);
      });

      if (toAppend.length === 0) continue;

      const updatedText = [...existingLines, ...toAppend].join('\n') + '\n';
      const putBody = {
        message: `feat(notes): add ${toAppend.length} new resource(s) to ${filePath}`,
        content: utf8ToBase64(updatedText)
      };
      if (existingSha) putBody.sha = existingSha;

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to commit ${filePath} to GitHub (${putRes.status})`);
      }

      totalCommitted += toAppend.length;
    }

    return totalCommitted;
  }

  // ─────────────────────────────────────────────────────────────
  // UI INJECTION & EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────

  function injectStudioStylesAndMarkup() {
    if (document.getElementById('ownerStudioModal')) return;

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      #ownerStudioModal .studio-window {
        width: min(96vw, 1360px);
        height: min(92vh, 880px);
        background: #070d14;
        border: 1px solid #1c2e40;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #e2e8f0;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .studio-topbar {
        height: 56px;
        padding: 0 1.25rem;
        background: #05090d;
        border-bottom: 1px solid #182838;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      .studio-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .studio-title {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .studio-meta-sep {
        color: #475569;
        font-size: 0.8rem;
      }
      .studio-subtitle {
        color: #94a3b8;
        font-size: 0.78rem;
        font-family: 'DM Mono', monospace;
        font-variant-numeric: tabular-nums;
      }
      .studio-tabs {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: #0a121c;
        padding: 0.25rem;
        border-radius: 8px;
        border: 1px solid #182838;
      }
      .studio-tab-btn {
        padding: 0.38rem 0.85rem;
        border-radius: 6px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #94a3b8;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: color 0.15s ease, background-color 0.15s ease;
        white-space: nowrap;
      }
      .studio-tab-btn:hover {
        color: #f1f5f9;
      }
      .studio-tab-btn.active {
        background: #132234;
        color: #34d399;
      }
      .studio-body {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      .studio-left-pane {
        width: 370px;
        background: #091018;
        border-right: 1px solid #182838;
        padding: 1.15rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
        flex-shrink: 0;
      }
      .studio-right-pane {
        flex: 1;
        background: #060b10;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .studio-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #cbd5e1;
        margin-bottom: 0.35rem;
      }
      .studio-hint {
        font-size: 0.72rem;
        color: #64748b;
        line-height: 1.45;
      }
      .studio-input, .studio-select, .studio-textarea {
        width: 100%;
        background: #0c1520;
        border: 1px solid #1e3246;
        border-radius: 7px;
        color: #f1f5f9;
        padding: 0.5rem 0.65rem;
        font-size: 0.8rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
        outline: none;
        transition: border-color 0.15s ease;
      }
      .studio-textarea {
        font-family: 'DM Mono', monospace;
        font-size: 0.75rem;
        line-height: 1.5;
        resize: vertical;
      }
      .studio-input:focus, .studio-select:focus, .studio-textarea:focus {
        border-color: #10b981;
      }
      .studio-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.5rem 0.95rem;
        border-radius: 7px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid #1e3246;
        background: #101c2b;
        color: #e2e8f0;
        white-space: nowrap;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .studio-btn:hover:not(:disabled) {
        background: #16263a;
        border-color: #2c4763;
      }
      .studio-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .studio-btn-primary {
        background: #10b981;
        border-color: #059669;
        color: #04130e;
        font-weight: 700;
      }
      .studio-btn-primary:hover:not(:disabled) {
        background: #34d399;
        border-color: #10b981;
      }
      .studio-grid-header {
        padding: 0.75rem 1.15rem;
        background: #091018;
        border-bottom: 1px solid #182838;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .studio-table-wrap {
        flex: 1;
        overflow: auto;
      }
      .studio-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.78rem;
      }
      .studio-table th {
        position: sticky;
        top: 0;
        background: #0a121c;
        color: #94a3b8;
        font-weight: 600;
        text-align: left;
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid #182838;
        z-index: 2;
        white-space: nowrap;
      }
      .studio-table td {
        padding: 0.42rem 0.75rem;
        border-bottom: 1px solid #111d2b;
        vertical-align: middle;
      }
      .studio-table tr:hover td {
        background: rgba(16, 185, 129, 0.03);
      }
      .studio-inline-input {
        width: 100%;
        background: #0a121c;
        border: 1px solid #192a3d;
        border-radius: 5px;
        color: #f1f5f9;
        padding: 0.28rem 0.5rem;
        font-size: 0.76rem;
      }
      .studio-inline-input:focus {
        border-color: #34d399;
        outline: none;
      }
      .studio-footer {
        padding: 0.75rem 1.25rem;
        background: #05090d;
        border-top: 1px solid #182838;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-shrink: 0;
      }
      .studio-num {
        font-family: 'DM Mono', monospace;
        font-variant-numeric: tabular-nums;
      }
      @media (max-width: 960px) {
        .studio-body {
          flex-direction: column;
          overflow-y: auto;
        }
        .studio-left-pane {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #182838;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'og-modal-backdrop';
    modalBackdrop.id = 'ownerStudioModal';
    modalBackdrop.innerHTML = `<div class="studio-window" id="ownerStudioWindow"></div>`;
    document.body.appendChild(modalBackdrop);
  }

  function openOwnerStudio() {
    injectStudioStylesAndMarkup();
    loadSavedSession();
    renderStudioModal();
    const modal = document.getElementById('ownerStudioModal');
    if (modal) modal.classList.add('open');
  }

  function closeOwnerStudio() {
    const modal = document.getElementById('ownerStudioModal');
    if (modal) modal.classList.remove('open');
    if (window.location.hash.includes('admin')) {
      history.replaceState(null, '', '#/');
    }
  }

  // Render Studio Content (Auth Gate vs. Active Workspace)
  function renderStudioModal() {
    const win = document.getElementById('ownerStudioWindow');
    if (!win) return;

    const totalNotesCount = (window.allNotes || []).length;

    if (!studioState.isAuthenticated) {
      win.innerHTML = `
        <div class="studio-topbar">
          <div class="studio-brand">
            <span class="studio-title">Owner Notes Ingestion Studio</span>
            <span class="studio-meta-sep">·</span>
            <span class="studio-subtitle">Restricted Access</span>
          </div>
          <button class="studio-btn" onclick="window.closeOwnerStudio()">Close (ESC)</button>
        </div>
        <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:1.5rem;">
          <div style="width:100%; max-width:460px; background:#091018; border:1px solid #1c2e40; border-radius:10px; padding:1.75rem;">
            <h2 style="font-family:'Space Grotesk',sans-serif; font-size:1.2rem; font-weight:700; color:#f8fafc; margin-bottom:0.35rem;">
              Unlock Private Notes Studio
            </h2>
            <p class="studio-hint" style="margin-bottom:1.25rem;">
              Authenticate with your GitHub Personal Access Token (recommended — 100% free and commits new notes directly to your repo for Vercel) or your server Admin Passkey.
            </p>

            <div style="margin-bottom:0.9rem;">
              <label class="studio-label">GitHub Personal Access Token (Fine-grained or Classic)</label>
              <input type="password" id="studioAuthGithubToken" class="studio-input" placeholder="ghp_... or github_pat_..." value="${escapeAttr(studioState.githubToken)}" />
              <div class="studio-hint" style="margin-top:0.25rem;">Verifies repository ownership and enables 1-click live Vercel deployment.</div>
            </div>

            <div style="margin-bottom:0.9rem;">
              <label class="studio-label">GitHub Repository (owner/repo — auto-detected if left blank)</label>
              <input type="text" id="studioAuthGithubRepo" class="studio-input" placeholder="e.g. username/class-12-isc" value="${escapeAttr(studioState.githubRepo)}" />
            </div>

            <div style="display:flex; align-items:center; gap:0.75rem; margin:0.85rem 0; color:#475569; font-size:0.72rem;">
              <div style="flex:1; height:1px; background:#182838;"></div>
              <span>OR LOCAL SERVER PASSKEY</span>
              <div style="flex:1; height:1px; background:#182838;"></div>
            </div>

            <div style="margin-bottom:1rem;">
              <label class="studio-label">Server Admin Passkey</label>
              <input type="password" id="studioAuthPasskey" class="studio-input" placeholder="Enter ADMIN_PASSKEY (default: isc-owner-2026)" value="${escapeAttr(studioState.passkey)}" />
            </div>

            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.76rem; color:#94a3b8; margin-bottom:1.25rem; cursor:pointer;">
              <input type="checkbox" id="studioAuthRemember" ${studioState.rememberDevice ? 'checked' : ''} />
              <span>Remember my owner session on this browser</span>
            </label>

            <div id="studioAuthError" style="color:#f87171; font-size:0.76rem; margin-bottom:0.75rem; display:none;"></div>

            <button type="button" class="studio-btn studio-btn-primary" style="width:100%; padding:0.65rem;" onclick="window.handleStudioLogin()">
              Verify & Unlock Studio
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Active Authenticated Workspace
    const newCount = studioState.stagingItems.filter(i => i.status !== 'duplicate').length;
    const dupCount = studioState.stagingItems.filter(i => i.status === 'duplicate').length;
    const subjectOptionsHtml = ISC_SUBJECTS.map(s =>
      `<option value="${escapeAttr(s)}" ${s === studioState.defaultSubject ? 'selected' : ''}>${escapeHtml(s)}</option>`
    ).join('');
    const existingCats = getExistingCategoriesForSubject(studioState.defaultSubject);
    const datalistHtml = existingCats.map(c => `<option value="${escapeAttr(c)}"></option>`).join('');

    win.innerHTML = `
      <div class="studio-topbar">
        <div class="studio-brand">
          <span class="studio-title">ISC.exe Owner Notes Studio</span>
          <span class="studio-meta-sep">·</span>
          <span class="studio-subtitle">${totalNotesCount} Existing Notes Preserved</span>
          <span class="studio-meta-sep">·</span>
          <span class="studio-subtitle" style="color:#34d399;">Unlocked (${escapeHtml(studioState.authUser || 'Owner')})</span>
        </div>

        <div class="studio-tabs">
          <button type="button" class="studio-tab-btn ${studioState.activeTab === 'quick' ? 'active' : ''}" onclick="window.switchStudioTab('quick')">
            01. Smart Link & Quick-Add UI
          </button>
          <button type="button" class="studio-tab-btn ${studioState.activeTab === 'bulk' ? 'active' : ''}" onclick="window.switchStudioTab('bulk')">
            02. Bulk Folder Normalizer (Roman Sort & Auto-Cluster)
          </button>
        </div>

        <div style="display:flex; align-items:center; gap:0.5rem;">
          <button type="button" class="studio-btn" onclick="window.logoutOwnerStudio()" title="Lock Studio">Lock</button>
          <button type="button" class="studio-btn" onclick="window.closeOwnerStudio()">✕</button>
        </div>
      </div>

      <datalist id="studioSubjectCategoriesList">${datalistHtml}</datalist>

      ${studioState.activeTab === 'quick' ? renderQuickAddTab(subjectOptionsHtml, existingCats) : renderBulkNormalizerTab(subjectOptionsHtml)}

      <div class="studio-footer">
        <div style="display:flex; align-items:center; gap:0.65rem; font-size:0.76rem; color:#94a3b8;">
          <span class="studio-num" style="color:#f8fafc; font-weight:600;">${studioState.stagingItems.length} Staged</span>
          <span>·</span>
          <span class="studio-num" style="color:#34d399;">${newCount} New to Add</span>
          <span>·</span>
          <span class="studio-num" style="color:#fbbf24;">${dupCount} Already in Catalog (Auto-Skipped)</span>
          ${studioState.statusMessage ? `<span>·</span><span style="color:#38bdf8;">${escapeHtml(studioState.statusMessage)}</span>` : ''}
        </div>

        <div style="display:flex; align-items:center; gap:0.6rem;">
          <button type="button" class="studio-btn" onclick="window.copyStagingFlatOutput()" ${studioState.stagingItems.length === 0 ? 'disabled' : ''}>
            Copy Flat Output (Path|URL)
          </button>
          <button type="button" class="studio-btn studio-btn-primary" onclick="window.publishStagingNotes()" ${newCount === 0 || studioState.isBusy ? 'disabled' : ''}>
            ${studioState.isBusy ? 'Syncing & Publishing...' : `Publish ${newCount} New Note${newCount === 1 ? '' : 's'} to Live Site`}
          </button>
        </div>
      </div>
    `;
  }

  function renderQuickAddTab(subjectOptionsHtml, existingCats) {
    const rowsHtml = studioState.stagingItems.length === 0
      ? `
        <tr>
          <td colspan="6" style="padding:3.5rem 1.5rem; text-align:center; color:#64748b;">
            <div style="font-size:0.9rem; font-weight:600; color:#cbd5e1; margin-bottom:0.35rem;">
              No files staged yet
            </div>
            <div style="font-size:0.78rem; max-width:520px; margin:0 auto 1rem auto; line-height:1.5;">
              Paste any Google Drive <b>Folder Link</b> or <b>File Link(s)</b> on the left for automatic filename, subject, and chapter recognition — or click <b>+ Add Manual Note Row</b> below.
            </div>
            <button type="button" class="studio-btn" onclick="window.addManualStagingRow()">
              + Add Manual Note Row
            </button>
          </td>
        </tr>
      `
      : studioState.stagingItems.map((item, idx) => {
          const isDup = item.status === 'duplicate';
          return `
            <tr data-idx="${idx}">
              <td class="studio-num" style="color:#64748b; width:42px;">${String(idx + 1).padStart(2, '0')}</td>
              <td style="min-width:240px;">
                <input type="text" class="studio-inline-input" value="${escapeAttr(item.fileName)}" onchange="window.updateStagingItem(${idx}, 'fileName', this.value)" placeholder="Filename.pdf" />
              </td>
              <td style="width:155px;">
                <select class="studio-inline-input" onchange="window.updateStagingItem(${idx}, 'subject', this.value)">
                  ${ISC_SUBJECTS.map(s => `<option value="${escapeAttr(s)}" ${s === item.subject ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
              </td>
              <td style="min-width:190px;">
                <input type="text" list="studioSubjectCategoriesList" class="studio-inline-input" value="${escapeAttr(item.category)}" onchange="window.updateStagingItem(${idx}, 'category', this.value)" placeholder="Chapter / Subfolder" />
              </td>
              <td style="width:135px; font-size:0.73rem;">
                ${isDup
                  ? `<span style="color:#fbbf24;">Duplicate (Skip)</span>`
                  : `<span style="color:#34d399;">Ready · ${escapeHtml(item.tag || 'Study Notes')}</span>`
                }
              </td>
              <td style="width:70px; text-align:right;">
                <button type="button" class="studio-btn" style="padding:0.22rem 0.5rem; font-size:0.72rem; color:#f87171;" onclick="window.removeStagingItem(${idx})" title="Remove row">
                  Remove
                </button>
              </td>
            </tr>
          `;
        }).join('');

    return `
      <div class="studio-body">
        <div class="studio-left-pane">
          <div>
            <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.88rem; color:#f8fafc; margin-bottom:0.25rem;">
              1. Default Target Subject & Folder
            </div>
            <div class="studio-hint" style="margin-bottom:0.65rem;">
              Auto-recognition predicts the subject & chapter from each filename, using these as fallback defaults.
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
              <div>
                <label class="studio-label">Default Subject</label>
                <select class="studio-select" onchange="window.setStudioDefaultSubject(this.value)">
                  ${subjectOptionsHtml}
                </select>
              </div>
              <div>
                <label class="studio-label">Default Subfolder</label>
                <input type="text" list="studioSubjectCategoriesList" class="studio-input" placeholder="e.g. Chapter Notes" value="${escapeAttr(studioState.defaultCategory)}" onchange="window.setStudioDefaultCategory(this.value)" />
              </div>
            </div>
          </div>

          <div style="border-top:1px solid #182838; padding-top:0.9rem;">
            <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.88rem; color:#f8fafc; margin-bottom:0.25rem;">
              2. Smart Link & Folder Auto-Recognition
            </div>
            <div class="studio-hint" style="margin-bottom:0.5rem;">
              Paste one or more Google Drive <b>Folder URLs</b>, <b>File URLs</b>, or <code>Path|URL</code> lines. Works automatically without an API key.
            </div>
            <textarea id="studioSmartLinkInput" class="studio-textarea" rows="5" placeholder="https://drive.google.com/drive/folders/...&#10;https://drive.google.com/file/d/.../view"></textarea>
            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
              <button type="button" class="studio-btn studio-btn-primary" style="flex:1;" onclick="window.handleSmartLinkInspect()" ${studioState.isBusy ? 'disabled' : ''}>
                ${studioState.isBusy ? 'Inspecting Links...' : 'Auto-Recognize & Stage Files'}
              </button>
            </div>
          </div>

          <div style="border-top:1px solid #182838; padding-top:0.9rem;">
            <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.88rem; color:#f8fafc; margin-bottom:0.25rem;">
              3. Quick Manual Single-File Add
            </div>
            <div class="studio-hint" style="margin-bottom:0.5rem;">
              Prefer adding a file directly? Paste its link and title below.
            </div>
            <div style="display:flex; flex-direction:column; gap:0.45rem;">
              <input type="text" id="studioQuickManualUrl" class="studio-input" placeholder="Google Drive File URL (https://drive.google.com/...)" />
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">
                <input type="text" id="studioQuickManualTitle" class="studio-input" placeholder="Title (optional if auto)" />
                <input type="text" id="studioQuickManualCat" list="studioSubjectCategoriesList" class="studio-input" placeholder="Subfolder / Category" value="${escapeAttr(studioState.defaultCategory)}" />
              </div>
              <button type="button" class="studio-btn" onclick="window.handleQuickManualAdd()">
                + Add Note to Staging Table
              </button>
            </div>
          </div>

          <div style="border-top:1px solid #182838; padding-top:0.85rem; margin-top:auto;">
            <label class="studio-label">GitHub Repo for Vercel Auto-Deploy</label>
            <input type="text" class="studio-input" placeholder="owner/repo (e.g. user/isc-notes)" value="${escapeAttr(studioState.githubRepo)}" onchange="window.updateStudioRepo(this.value)" />
            <div class="studio-hint" style="margin-top:0.25rem;">
              Existing ${existingCats.length} folders in ${escapeHtml(studioState.defaultSubject)}: ${existingCats.slice(0, 5).map(escapeHtml).join(' · ') || 'Default'}
            </div>
          </div>
        </div>

        <div class="studio-right-pane">
          <div class="studio-grid-header">
            <div>
              <span style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.9rem; color:#f8fafc;">
                Staged Notes Review & Visual Editor
              </span>
              <span class="studio-meta-sep" style="margin:0 0.45rem;">·</span>
              <span class="studio-hint">Edit any title, subject, or subfolder inline before publishing</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
              <button type="button" class="studio-btn" style="padding:0.32rem 0.65rem; font-size:0.73rem;" onclick="window.applyDefaultToAllStaged()">
                Apply Default Subject/Folder to All
              </button>
              <button type="button" class="studio-btn" style="padding:0.32rem 0.65rem; font-size:0.73rem;" onclick="window.sortAndClusterStaged()">
                Roman Sort & Auto-Cluster
              </button>
              <button type="button" class="studio-btn" style="padding:0.32rem 0.65rem; font-size:0.73rem;" onclick="window.addManualStagingRow()">
                + Row
              </button>
              <button type="button" class="studio-btn" style="padding:0.32rem 0.65rem; font-size:0.73rem; color:#f87171;" onclick="window.clearStagingItems()">
                Clear All
              </button>
            </div>
          </div>

          <div class="studio-table-wrap">
            <table class="studio-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Filename / Note Title</th>
                  <th>Subject</th>
                  <th>Subfolder / Category</th>
                  <th>Catalog Status</th>
                  <th style="text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderBulkNormalizerTab(subjectOptionsHtml) {
    const flatOutput = studioState.bulkNormalizedLines.map(i => i.formattedLine).join('\n');
    return `
      <div class="studio-body">
        <div class="studio-left-pane">
          <div>
            <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.88rem; color:#f8fafc; margin-bottom:0.25rem;">
              Dual Processing Mode (Drive API / Raw List)
            </div>
            <div class="studio-hint" style="margin-bottom:0.6rem;">
              Fetch recursively from a Google Drive folder (zero-key or with optional API key) or paste messy file paths & URLs below.
            </div>
            <label class="studio-label">Target ISC Subject</label>
            <select class="studio-select" style="margin-bottom:0.6rem;" onchange="window.setStudioDefaultSubject(this.value)">
              ${subjectOptionsHtml}
            </select>

            <label class="studio-label">Google Drive Folder Link or ID</label>
            <input type="text" id="studioBulkFolderUrl" class="studio-input" style="margin-bottom:0.5rem;" placeholder="https://drive.google.com/drive/folders/..." />

            <label class="studio-label">Optional Google Drive API Key (Leaves blank for Zero-Key)</label>
            <input type="password" id="studioBulkDriveKey" class="studio-input" style="margin-bottom:0.55rem;" placeholder="AIzaSy... (optional)" value="${escapeAttr(studioState.driveApiKey)}" />

            <button type="button" class="studio-btn studio-btn-primary" style="width:100%;" onclick="window.handleBulkFolderFetch()" ${studioState.isBusy ? 'disabled' : ''}>
              ${studioState.isBusy ? 'Fetching Folder...' : 'Fetch & Normalize Drive Folder'}
            </button>
          </div>

          <div style="border-top:1px solid #182838; padding-top:0.85rem;">
            <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.88rem; color:#f8fafc; margin-bottom:0.45rem;">
              Smart Normalization Rules
            </div>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.76rem; color:#cbd5e1; margin-bottom:0.4rem; cursor:pointer;">
              <input type="checkbox" ${studioState.bulkOptions.romanSort ? 'checked' : ''} onchange="window.toggleBulkOption('romanSort', this.checked)" />
              <span>Roman Numeral Chronological Sort (I, IV, IX, XII)</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.76rem; color:#cbd5e1; margin-bottom:0.4rem; cursor:pointer;">
              <input type="checkbox" ${studioState.bulkOptions.autoCluster ? 'checked' : ''} onchange="window.toggleBulkOption('autoCluster', this.checked)" />
              <span>Auto-Cluster Virtual Subfolders (Shared Prefixes)</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.76rem; color:#cbd5e1; margin-bottom:0.5rem; cursor:pointer;">
              <input type="checkbox" ${studioState.bulkOptions.stripRoot ? 'checked' : ''} onchange="window.toggleBulkOption('stripRoot', this.checked)" />
              <span>Sanitize Paths (Strip Root/ & Leading Slashes)</span>
            </label>
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75rem; color:#94a3b8;">
              <span>Min shared words for virtual folder:</span>
              <select class="studio-select" style="width:80px; padding:0.25rem 0.4rem;" onchange="window.toggleBulkOption('minSharedWords', parseInt(this.value, 10))">
                <option value="2" ${studioState.bulkOptions.minSharedWords === 2 ? 'selected' : ''}>2 words</option>
                <option value="3" ${studioState.bulkOptions.minSharedWords === 3 ? 'selected' : ''}>3 words</option>
                <option value="4" ${studioState.bulkOptions.minSharedWords === 4 ? 'selected' : ''}>4 words</option>
              </select>
            </div>
          </div>

          <div style="border-top:1px solid #182838; padding-top:0.85rem; flex:1; display:flex; flex-direction:column;">
            <label class="studio-label">Or Paste Raw Path|URL List to Normalize</label>
            <textarea id="studioBulkRawPaste" class="studio-textarea" style="flex:1; min-height:110px;" placeholder="Root/Chapter XII/Notes.pdf|https://drive.google.com/...&#10;Chapter IX/Notes.pdf|https://drive.google.com/..."></textarea>
            <button type="button" class="studio-btn" style="margin-top:0.5rem; width:100%;" onclick="window.handleBulkRawProcess()">
              Process, Sort & Auto-Cluster Raw Text
            </button>
          </div>
        </div>

        <div class="studio-right-pane" style="padding:1.15rem; gap:0.85rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <span style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.9rem; color:#f8fafc;">
                Strict Flat Directory Output
              </span>
              <span class="studio-meta-sep" style="margin:0 0.45rem;">·</span>
              <span class="studio-subtitle">${studioState.bulkNormalizedLines.length} lines formatted as Folder/Subfolder/Filename|URL</span>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="studio-btn" onclick="window.copyBulkNormalizedResult()" ${!flatOutput ? 'disabled' : ''}>
                Copy Result
              </button>
              <button type="button" class="studio-btn studio-btn-primary" onclick="window.sendBulkToStagingQueue()" ${studioState.bulkNormalizedLines.length === 0 ? 'disabled' : ''}>
                Send ${studioState.bulkNormalizedLines.length} Items to Publish Queue →
              </button>
            </div>
          </div>

          <textarea id="studioBulkOutputBox" class="studio-textarea" style="flex:1; width:100%; background:#05090d;" readonly placeholder="Normalized Folder/Subfolder/Filename|URL output will appear here...">${escapeHtml(flatOutput)}</textarea>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  // ─────────────────────────────────────────────────────────────
  // INTERACTIVE WORKFLOW CONTROLLERS
  // ─────────────────────────────────────────────────────────────

  window.openOwnerStudio = openOwnerStudio;
  window.closeOwnerStudio = closeOwnerStudio;
  window.logoutOwnerStudio = logoutStudio;

  window.handleStudioLogin = async function () {
    const tokenEl = document.getElementById('studioAuthGithubToken');
    const repoEl = document.getElementById('studioAuthGithubRepo');
    const passEl = document.getElementById('studioAuthPasskey');
    const remEl = document.getElementById('studioAuthRemember');
    const errEl = document.getElementById('studioAuthError');

    const githubToken = tokenEl ? tokenEl.value.trim() : '';
    let githubRepo = repoEl ? repoEl.value.trim() : '';
    const passkey = passEl ? passEl.value.trim() : '';
    studioState.rememberDevice = remEl ? remEl.checked : true;

    if (!githubToken && !passkey) {
      if (errEl) {
        errEl.textContent = 'Please enter either your GitHub Personal Access Token or your Admin Passkey.';
        errEl.style.display = 'block';
      }
      return;
    }

    try {
      // 1. If GitHub token provided, verify directly against GitHub API
      if (githubToken) {
        const ghRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json'
          }
        });
        if (!ghRes.ok) {
          throw new Error('GitHub token verification failed. Check that the token is valid.');
        }
        const userData = await ghRes.json();
        if (!githubRepo) {
          githubRepo = await detectUserGithubRepo(githubToken);
        }
        studioState.isAuthenticated = true;
        studioState.authMethod = 'github';
        studioState.authUser = userData.login || 'GitHub Owner';
        studioState.githubToken = githubToken;
        studioState.githubRepo = githubRepo;
        studioState.passkey = passkey;
        saveSession();
        renderStudioModal();
        if (window.showToast) window.showToast(`Unlocked Studio as @${studioState.authUser}`);
        return;
      }

      // 2. Otherwise verify passkey against backend /api/admin/verify
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey, githubToken, githubRepo })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated) {
          studioState.isAuthenticated = true;
          studioState.authMethod = data.method || 'passkey';
          studioState.authUser = data.user || 'Owner';
          studioState.passkey = passkey;
          studioState.githubRepo = githubRepo || data.githubRepo || '';
          saveSession();
          renderStudioModal();
          if (window.showToast) window.showToast('Owner Studio Unlocked');
          return;
        }
      }

      throw new Error('Invalid Admin Passkey or GitHub Token.');
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || 'Authentication failed';
        errEl.style.display = 'block';
      }
    }
  };

  window.switchStudioTab = function (tab) {
    studioState.activeTab = tab;
    renderStudioModal();
  };

  window.setStudioDefaultSubject = function (subj) {
    studioState.defaultSubject = subj;
    renderStudioModal();
  };

  window.setStudioDefaultCategory = function (cat) {
    studioState.defaultCategory = (cat || '').trim();
  };

  window.updateStudioRepo = function (repo) {
    studioState.githubRepo = (repo || '').trim();
    saveSession();
  };

  function stageExtractedItems(rawItems) {
    let added = 0;
    rawItems.forEach(raw => {
      const driveId = raw.driveId || extractDriveId(raw.url);
      const url = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : (raw.url || '');
      if (!url) return;

      // Avoid duplicating already staged items
      if (driveId && studioState.stagingItems.some(s => s.driveId === driveId)) {
        return;
      }

      const fileName = (raw.fileName || 'Untitled.pdf').trim();
      const classified = autoClassifyFile(fileName, raw.folderPath || '', studioState.defaultSubject, studioState.defaultCategory);
      const isDup = isDuplicateInCatalog(driveId, url);

      studioState.stagingItems.push({
        id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fileName,
        subject: classified.subject,
        category: classified.category,
        tag: classified.tag,
        url,
        driveId,
        status: isDup ? 'duplicate' : 'new'
      });
      added++;
    });
    return added;
  }

  window.handleSmartLinkInspect = async function () {
    const inputEl = document.getElementById('studioSmartLinkInput');
    const rawInput = inputEl ? inputEl.value.trim() : '';
    if (!rawInput) {
      if (window.showToast) window.showToast('Paste at least one Google Drive file or folder link');
      return;
    }

    studioState.isBusy = true;
    studioState.statusMessage = 'Auto-recognizing Google Drive links...';
    renderStudioModal();

    try {
      let items = [];
      try {
        const res = await fetch('/api/admin/inspect-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: rawInput,
            driveApiKey: studioState.driveApiKey
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            items = data.items;
          }
        }
      } catch (e) {}

      // Fallback to browser inspector if static host or 0 items returned
      if (items.length === 0) {
        items = await clientFallbackInspectLinks(rawInput, studioState.driveApiKey);
      }

      const addedCount = stageExtractedItems(items);
      studioState.statusMessage = addedCount > 0
        ? `Recognized and staged ${addedCount} file(s)`
        : 'Could not auto-extract files from link — use Quick Manual Add below';
      if (window.showToast) window.showToast(studioState.statusMessage);
    } catch (err) {
      studioState.statusMessage = `Error: ${err.message}`;
    } finally {
      studioState.isBusy = false;
      renderStudioModal();
    }
  };

  window.handleQuickManualAdd = async function () {
    const urlEl = document.getElementById('studioQuickManualUrl');
    const titleEl = document.getElementById('studioQuickManualTitle');
    const catEl = document.getElementById('studioQuickManualCat');

    const rawUrl = urlEl ? urlEl.value.trim() : '';
    let title = titleEl ? titleEl.value.trim() : '';
    const cat = catEl ? catEl.value.trim() : (studioState.defaultCategory || 'Chapter Notes');

    if (!rawUrl) {
      if (window.showToast) window.showToast('Please paste a Google Drive file link');
      return;
    }

    const driveId = extractDriveId(rawUrl);
    const finalUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rawUrl;

    // If title was left blank, try auto-recognizing it!
    if (!title && driveId) {
      studioState.statusMessage = 'Fetching filename from Drive link...';
      renderStudioModal();
      try {
        const res = await fetch('/api/admin/inspect-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: rawUrl })
        });
        if (res.ok) {
          const d = await res.json();
          if (d?.items?.[0]?.fileName) title = d.items[0].fileName;
        }
      } catch (e) {}
    }

    if (!title) {
      title = driveId ? `ISC_Note_${driveId.substring(0, 6)}.pdf` : 'Untitled_Note.pdf';
    } else if (!/\.[a-zA-Z0-9]{2,5}$/.test(title)) {
      title += '.pdf';
    }

    const classified = autoClassifyFile(title, cat, studioState.defaultSubject, cat);
    const isDup = isDuplicateInCatalog(driveId, finalUrl);

    studioState.stagingItems.push({
      id: `stage-${Date.now()}`,
      fileName: title,
      subject: studioState.defaultSubject,
      category: cat || classified.category,
      tag: classified.tag,
      url: finalUrl,
      driveId,
      status: isDup ? 'duplicate' : 'new'
    });

    studioState.statusMessage = `Added "${title}" to staging table`;
    renderStudioModal();
  };

  window.addManualStagingRow = function () {
    studioState.stagingItems.push({
      id: `stage-${Date.now()}`,
      fileName: 'New_Chapter_Notes.pdf',
      subject: studioState.defaultSubject || 'Economics',
      category: studioState.defaultCategory || 'Chapter Notes',
      tag: 'Study Notes',
      url: 'https://drive.google.com/file/d/PASTE_ID_HERE/preview',
      driveId: '',
      status: 'new'
    });
    renderStudioModal();
  };

  window.updateStagingItem = function (idx, field, value) {
    const item = studioState.stagingItems[idx];
    if (!item) return;
    item[field] = value;
    if (field === 'fileName') {
      const c = autoClassifyFile(value, item.category, item.subject, item.category);
      item.tag = c.tag;
    }
  };

  window.removeStagingItem = function (idx) {
    studioState.stagingItems.splice(idx, 1);
    renderStudioModal();
  };

  window.clearStagingItems = function () {
    studioState.stagingItems = [];
    studioState.statusMessage = 'Cleared staging table';
    renderStudioModal();
  };

  window.applyDefaultToAllStaged = function () {
    studioState.stagingItems.forEach(item => {
      item.subject = studioState.defaultSubject;
      if (studioState.defaultCategory) {
        item.category = studioState.defaultCategory;
      }
    });
    studioState.statusMessage = `Applied ${studioState.defaultSubject}${studioState.defaultCategory ? ' / ' + studioState.defaultCategory : ''} to all staged items`;
    renderStudioModal();
  };

  window.sortAndClusterStaged = function () {
    if (studioState.stagingItems.length === 0) return;
    const rawForCluster = studioState.stagingItems.map(it => ({
      ...it,
      folderPath: (it.category && it.category !== 'Chapter Notes') ? it.category : ''
    }));
    const normalized = normalizeAndClusterEntries(rawForCluster, studioState.bulkOptions);
    studioState.stagingItems = normalized.map(n => ({
      id: n.id,
      fileName: n.fileName,
      subject: n.subject,
      category: n.folderPath || 'Chapter Notes',
      tag: n.tag,
      url: n.url,
      driveId: n.driveId,
      status: n.status
    }));
    studioState.statusMessage = 'Applied Roman Numeral Chronological Sort & Prefix Auto-Clustering';
    renderStudioModal();
  };

  // Bulk Tab Handlers
  window.toggleBulkOption = function (key, val) {
    studioState.bulkOptions[key] = val;
    if (studioState.bulkNormalizedLines.length > 0) {
      studioState.bulkNormalizedLines = normalizeAndClusterEntries(studioState.bulkNormalizedLines, studioState.bulkOptions);
      renderStudioModal();
    }
  };

  window.handleBulkFolderFetch = async function () {
    const folderInput = document.getElementById('studioBulkFolderUrl');
    const keyInput = document.getElementById('studioBulkDriveKey');
    const folderUrl = folderInput ? folderInput.value.trim() : '';
    const apiKey = keyInput ? keyInput.value.trim() : '';

    if (apiKey) {
      studioState.driveApiKey = apiKey;
      saveSession();
    }

    if (!folderUrl) {
      if (window.showToast) window.showToast('Enter a Google Drive folder URL');
      return;
    }

    studioState.isBusy = true;
    studioState.statusMessage = 'Fetching folder & running Roman sort + virtual clustering...';
    renderStudioModal();

    try {
      let items = [];
      try {
        const res = await fetch('/api/admin/inspect-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: folderUrl, driveApiKey: studioState.driveApiKey })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) items = data.items;
        }
      } catch (e) {}

      if (items.length === 0) {
        items = await clientFallbackInspectLinks(folderUrl, studioState.driveApiKey);
      }

      studioState.bulkNormalizedLines = normalizeAndClusterEntries(items, studioState.bulkOptions);
      studioState.statusMessage = `Normalized ${studioState.bulkNormalizedLines.length} files from Drive folder`;
    } catch (err) {
      studioState.statusMessage = `Folder fetch error: ${err.message}`;
    } finally {
      studioState.isBusy = false;
      renderStudioModal();
    }
  };

  window.handleBulkRawProcess = async function () {
    const rawEl = document.getElementById('studioBulkRawPaste');
    const rawText = rawEl ? rawEl.value.trim() : '';
    if (!rawText) {
      if (window.showToast) window.showToast('Paste raw Path|URL lines or Drive links first');
      return;
    }

    const parsed = await clientFallbackInspectLinks(rawText, studioState.driveApiKey);
    studioState.bulkNormalizedLines = normalizeAndClusterEntries(parsed, studioState.bulkOptions);
    studioState.statusMessage = `Sorted & clustered ${studioState.bulkNormalizedLines.length} lines`;
    renderStudioModal();
  };

  window.copyBulkNormalizedResult = function () {
    const text = studioState.bulkNormalizedLines.map(i => i.formattedLine).join('\n');
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) window.showToast('Copied strict flat Folder/Subfolder/Filename|URL output to clipboard');
    });
  };

  window.copyStagingFlatOutput = function () {
    const lines = studioState.stagingItems.map(it => {
      const cat = (it.category && it.category !== 'Chapter Notes') ? `${it.category}/` : '';
      return `${cat}${it.fileName}|${it.url}`;
    }).join('\n');
    if (!lines) return;
    navigator.clipboard.writeText(lines).then(() => {
      if (window.showToast) window.showToast(`Copied ${studioState.stagingItems.length} formatted lines to clipboard`);
    });
  };

  window.sendBulkToStagingQueue = function () {
    const added = stageExtractedItems(studioState.bulkNormalizedLines);
    studioState.activeTab = 'quick';
    studioState.statusMessage = `Sent ${added} normalized file(s) to Publish Queue`;
    renderStudioModal();
  };

  window.publishStagingNotes = async function () {
    const toPublish = studioState.stagingItems.filter(i => i.status !== 'duplicate');
    if (toPublish.length === 0) return;

    studioState.isBusy = true;
    studioState.statusMessage = 'Publishing notes to catalog...';
    renderStudioModal();

    let serverPublished = false;
    let githubCommittedCount = 0;

    try {
      // 1. Update local/backend server files if available
      try {
        const res = await fetch('/api/admin/publish-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entries: toPublish,
            passkey: studioState.passkey || 'isc-owner-2026',
            githubToken: studioState.githubToken
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            serverPublished = true;
            if (Array.isArray(data.notes) && typeof window.refreshNotesCatalog === 'function') {
              window.refreshNotesCatalog(data.notes);
            }
          }
        }
      } catch (e) {}

      // 2. If GitHub Token & Repo are configured, also commit directly to GitHub for Vercel auto-deploy
      if (studioState.githubToken) {
        if (!studioState.githubRepo) {
          studioState.githubRepo = await detectUserGithubRepo(studioState.githubToken);
        }
        if (studioState.githubRepo) {
          studioState.statusMessage = `Committing to GitHub (${studioState.githubRepo})...`;
          renderStudioModal();
          githubCommittedCount = await commitNotesToGithub(
            studioState.githubToken,
            studioState.githubRepo,
            toPublish
          );
        }
      }

      // 3. Immediately update in-memory browser catalog even on static hosting
      if (!serverPublished && typeof window.appendNotesClientSide === 'function') {
        window.appendNotesClientSide(toPublish);
      }

      // Mark published items as already in catalog
      studioState.stagingItems.forEach(item => {
        item.status = 'duplicate';
      });

      const msgParts = [];
      if (serverPublished) msgParts.push(`Server catalog updated (${toPublish.length} added)`);
      if (githubCommittedCount > 0) msgParts.push(`Committed ${githubCommittedCount} note(s) to GitHub for Vercel`);
      if (msgParts.length === 0) msgParts.push(`Added ${toPublish.length} note(s) to live session`);

      studioState.statusMessage = msgParts.join(' · ');
      if (window.showToast) window.showToast(studioState.statusMessage);
    } catch (err) {
      studioState.statusMessage = `Publish Error: ${err.message}`;
      if (window.showToast) window.showToast(studioState.statusMessage);
    } finally {
      studioState.isBusy = false;
      renderStudioModal();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STEALTH TRIGGERS: #admin-upload HASH & Ctrl+Shift+U HOTKEY
  // ─────────────────────────────────────────────────────────────

  function checkAdminHash() {
    const h = (window.location.hash || '').toLowerCase();
    if (h === '#admin-upload' || h === '#admin' || h === '#/admin-upload' || h === '#/admin') {
      openOwnerStudio();
      return true;
    }
    return false;
  }

  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+U or Cmd+Shift+U
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      openOwnerStudio();
    }
  });

  window.addEventListener('hashchange', () => {
    checkAdminHash();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(checkAdminHash, 150));
  } else {
    setTimeout(checkAdminHash, 150);
  }
})();
