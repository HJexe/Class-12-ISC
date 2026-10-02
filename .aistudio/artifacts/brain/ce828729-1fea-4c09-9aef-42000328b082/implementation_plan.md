# Owner-Only Smart Notes Uploader & Drive Sync Studio

An integrated, private administrative studio built into the Class 12 ISC Resource Hub that features **zero-config Smart Link Recognition** (automatically extracting filenames, subjects, categories, and folder contents the moment you paste any Google Drive file or folder link) paired with a **frictionless Quick-Add Visual UI** and bulk directory normalizer that syncs directly to your server and GitHub/Vercel.

### User Review & Critical Decisions

> [!IMPORTANT]
> Updated per your feedback to prioritize **instant smart recognition when a link is attached** (without requiring a complex API setup) and a **simple, visual Quick-Add UI** as a seamless fallback whenever you want to add or tweak notes manually.

- **Confirmed Decision 1 — Zero-Key Smart Link & Folder Auto-Recognition**: When you paste any Google Drive **file link** or **folder link**, the studio automatically inspects Google Drive's public metadata and embedded folder view (`embeddedfolderview?id=...`) to extract all file names and URLs **without requiring a Google Drive API key** (while still supporting an optional Drive API key for deep multi-level folders). It then runs a **Smart ISC Classifier** that automatically recognizes the **Subject** (e.g., Accounts, Economics, Physics), **Category/Chapter Folder**, and **Resource Tag** (Study Notes, PYQ/Specimen, Worksheet, Quick Revision) from the filename.
- **Confirmed Decision 2 — Frictionless Quick-Add UI + Bulk Organizer**: If a link has restricted metadata or you prefer manual control, the studio provides a clean **Visual Quick-Add Card UI** (paste link -> confirm/edit Title, Subject chip, and Chapter folder dropdown -> click Add) alongside the **Bulk Folder Normalizer** (Roman-numeral chronological sorting + prefix auto-clustering).
- **Confirmed Decision 3 — Owner-Only Stealth Access & GitHub/Vercel Sync**: Accessed exclusively via `#admin-upload` or `Ctrl+Shift+U` (`Cmd+Shift+U`), protected by your GitHub Personal Access Token / Admin Passkey, and publishes non-destructively to both the backend files and your GitHub repository for automatic Vercel deployment.

---

### 1. Overview & Core Concept

- **What It Does**: Gives you a two-in-one private publishing workflow inside the website:
  1. **Smart Link Dropzone & Quick-Add UI**: Paste one or more Google Drive file or folder links. The app automatically resolves the file titles, detects which ISC Subject and Chapter Subfolder each file belongs to, and lets you review or adjust them with one-click dropdowns before publishing.
  2. **Bulk Directory Normalizer**: Takes large Google Drive folders or raw `Path|URL` lists and applies **Roman Numeral Chronological Sorting** (`I`, `II`, `IX`, `XII`), **Auto-Clustering into Virtual Subfolders** based on shared filename prefixes, and **Path Sanitization** (`Folder/Subfolder/Filename|URL`).
- **Target Audience / Persona**: Exclusively the platform owner managing Class 12 ISC study materials.
- **Key Value**: Turns adding new notes into a 10-second task — paste a Drive link, let smart recognition auto-fill the title, subject, and subfolder (or tweak it in the visual UI), and click **Publish to Live Site**.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Stealth Entry & Owner Unlock**: Press `Ctrl+Shift+U` (or visit `#admin-upload`) and unlock with your admin passkey / GitHub token (saved in your browser if you toggle *Remember this device*).
  2. **Workflow 1 — Smart Link Recognition & Quick-Add UI (Default Tab)**:
     - **Paste Any Link**: Paste a single Google Drive file URL, multiple file URLs, or a Google Drive folder URL into the Smart Link bar.
     - **Automatic Metadata & Folder Extraction**:
       - For *File Links*: Instantly fetches the real filename from Drive's `og:title` metadata, strips `.pdf`/underscores into a clean title, and auto-detects the **Subject**, **Chapter Category**, and **Tag**.
       - For *Folder Links*: Automatically scrapes the public Drive folder (`embeddedfolderview`) to pull every file inside the folder without needing a Drive API key (or uses your optional Drive API key if provided).
     - **Easy Visual Editor Cards**: Every detected file appears as an interactive row/card where you can:
       - Edit the **Title** inline.
       - Pick or change the **Subject** via single-click selector.
       - Pick an **Existing Subfolder** from an auto-populated dropdown for that subject (e.g., `Accounts` -> `Chapter 2 - Partnership Accounts`, `Worksheets`, `Miscellaneous`) or type a new subfolder name.
       - If auto-recognition cannot read a title (e.g., offline or private metadata), an instant inline input lets you type the title and pick the folder in 2 seconds.
  3. **Workflow 2 — Bulk Normalizer & Virtual Folder Auto-Cluster (Bulk Tab)**:
     - Paste messy `Path|URL` lists or import from a fetched Drive folder.
     - Automatically runs **Path Sanitization** (strips `Root/` and leading `/`), **Roman Numeral Chronological Sorting** (`Chapter IX` before `Chapter XII`), and **Prefix Auto-Clustering** (groups files sharing common prefixes like `"Theory Of Income And Employment"` into Title-Cased virtual subfolders).
     - Provides a one-click **Copy Flat Output** (`Folder/Subfolder/Filename|URL`) button or sends the batch directly to the Publish queue.
  4. **Non-Destructive Merge & Live Publish**:
     - Deduplicates against existing notes by Google Drive File ID so existing notes are never overwritten or duplicated.
     - Updates local server files (`<Subject>/text`, `files.json`, `notes-data.json`, `notes-data.js`, `notifications.json`, `notifications.js`) AND commits directly to GitHub so Vercel (`class12isc.dpdns.org`) updates automatically.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-density SaaS Batch Normalization & Content Studio (`references/3_saas_dashboard.md`), matching the dark obsidian & emerald aesthetic of ISC.exe 2.0.
  - *Color Palette & Mood*:
    - **60% Dominant Neutral Canvas**: Deep obsidian (`#05090D`) and surface slate (`#0A1118`).
    - **30% Structural Surfaces**: Single-elevation containers (`#0D1622`) with `1px solid #1C2E40` hairline borders and `#94A3B8` secondary prose.
    - **10% Semantic Accent Budget**: Emerald (`#10B981` / `#34D399`) for auto-recognized matches and primary publish CTA, Cyan (`#38BDF8`) for auto-clustered virtual folders, Amber (`#F59E0B`) for duplicate warnings or manual-title prompts.
  - *Typography & Hierarchy*:
    - **Headers**: `Space Grotesk` (600/700, `text-wrap: balance`).
    - **Controls & Visual Editor**: `Plus Jakarta Sans` (400/500, `14px`).
    - **Paths, Counts & Drive IDs**: `DM Mono` with `font-variant-numeric: tabular-nums`.
  - *Component Styling & Layout*:
    - Full-viewport studio modal (`1440px` desktop baseline) with a top mode switcher (**Smart Link & Quick-Add UI** vs. **Bulk Folder Normalizer**), single-elevation card depth, and clean unboxed metadata separators (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Zero-Key Drive Link & Folder Inspection + Fallback Visual UI**
  - *Chosen Approach*: Use a server-side & client-assisted inspector that extracts filenames from Google Drive file `og:title` tags and lists files inside public folders via `https://drive.google.com/embeddedfolderview?id={folderId}#list` (plus optional Google Drive API v3 key support), paired with an always-editable Quick-Add visual table.
  - *Why*: You don't have to set up a Google Cloud project or API key just to paste a Drive folder or file link—and if any link has unusual formatting, the visual Quick-Add UI lets you assign its title, subject, and folder with zero friction.
- **Decision 2 — Keyword-Driven ISC Subject & Subfolder Auto-Classifier**
  - *Chosen Approach*: Match extracted filenames and folder titles against a curated dictionary of ISC Class 12 syllabus chapters and keywords across all 14 subjects (e.g., *Partnership, Goodwill, Debentures, Cash Flow* -> `Accounts`; *Fiscal, Demand, National Income, Keynes* -> `Economics`; *Java, Boolean, K-Map, Recursion* -> `Computer Science`) and existing categories in `files.json`.
  - *Why*: Saves repetitive dropdown clicking when uploading mixed or subject-specific batches while letting you override any suggestion with a single click.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                STEALTH ENTRY (#admin-upload or Ctrl+Shift+U)               │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   SMART LINK & FOLDER RECOGNITION ENGINE                   │
│  • Single/Multi File URL → Fetches Drive og:title & File ID (Zero API Key) │
│  • Folder URL → Scrapes Drive embeddedfolderview + Optional Drive API v3   │
│  • ISC Auto-Classifier → Predicts Subject, Existing Subfolder & Tag        │
└──────────────────┬──────────────────────────────────────┬──────────────────┘
                   ▼                                      ▼
┌─────────────────────────────────────┐┌─────────────────────────────────────┐
│   TAB 1: VISUAL QUICK-ADD STUDIO    ││  TAB 2: BULK DIRECTORY NORMALIZER   │
│  • Editable Title, Subject & Folder ││  • Roman Numeral Sort (I, IV, IX..) │
│  • Instant Manual Add Row Fallback  ││  • Prefix Virtual Folder Clustering │
│  • Auto-Suggests Existing Subfolders││  • Strict 'Folder/Sub/File|URL' Out │
└──────────────────┬──────────────────┘└──────────────────┬──────────────────┘
                   └──────────────────┬───────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 NON-DESTRUCTIVE MERGE & GITHUB/SERVER SYNC                 │
│  • Deduplicates against existing notes-data.json by Drive File ID          │
│  • Appends to <Subject>/text & rebuilds notes-data.js + notifications.js   │
│  • Commits updated files to GitHub API so Vercel deploys automatically     │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `SmartLinkCandidate`: `{ id, rawUrl, driveId, linkType: 'file' | 'folder', detectedTitle, subject, category, targetRawFile, tag, confidence: 'auto' | 'manual', status: 'new' | 'duplicate' }`
  - `SubjectTaxonomyMap`: Built dynamically from `notes-data.json` and `files.json`, mapping each ISC Subject to its existing categories, `text` file paths, and syllabus keywords.
  - `NormalizationOptions`: `{ romanNumeralSort: boolean, autoClusterPrefixes: boolean, minSharedWords: number, stripRootPrefix: boolean }`

- **Interactive Component & State Mapping**:
  - **Smart Link Input Bar**: Detects paste events or button clicks; parses any number of Drive URLs, calls `/api/admin/inspect-drive` (with client-side fallback) to resolve titles and folder children, runs the ISC Auto-Classifier, and populates the **Quick-Add Review Table**.
  - **Quick-Add Visual Editor**: Allows one-click "+ Add Manual Note Row", inline editing of any recognized file's Title, Subject, Subfolder/Category (with autocomplete from existing subject categories or creating a new category), and Tag, plus bulk "Apply Subject/Category to Selected".
  - **Bulk Normalizer Engine**: Executes path sanitization, Roman numeral tokenization (`I`–`XX`), and common-prefix virtual folder grouping, updating the live preview grid and clipboard output (`Folder/Subfolder/Filename|URL`).
  - **Publish & GitHub Commit Controller**: Merges approved items into the target `<Subject>/.../text` files, regenerates `files.json`, `notes-data.json`, `notes-data.js`, `notifications.json`, and `notifications.js`, updates the live server, and commits all changed files to GitHub in a single atomic commit.
