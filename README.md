# 📚 Class 12 ISC Resources (Built with AI+github tutorials from yt)

A clean and simple website built to organize **ISC Class 12** study
materials in one place. **New updates will be coming soon**

🔗 Live Website: https://class-12-isc.vercel.app/

## 📂 Subjects Included

-    Economics
-    Accounts
-    Business Studies
-    Commerce
-    Maths
## 🚀 Features

-   Organized subject-wise folders
-   Easy access to notes & resources
-   Clean, minimal UI

## 🔗 Add Google Drive files (folder/subfolder wise)

You can now keep using local repo files **and** add Google Drive files inside the same tree.

### `files.json` supports 2 formats

1. **String (existing local file)**

```json
"Economics/Papers/sample paper 1.pdf"
```

2. **Object (Google Drive or external URL)**

```json
{
  "path": "Economics/Question Bank/Chapter 01/Case Study Pack.pdf",
  "url": "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID",
  "previewUrl": "https://drive.google.com/file/d/YOUR_FILE_ID/preview",
  "source": "gdrive"
}
```

### Important fields

- `path`: controls where the file appears in subject → folder → subfolder in UI.
- `url`: opens/downloads the file.
- `previewUrl` (optional but recommended): used in iframe preview directly.
- `source` (optional): use `"gdrive"` for clearer description label.

### How to place files in each folder/subfolder

- Use forward slashes in `path`:
  - `Accounts/Worksheets/Partnership/Set 1.pdf`
  - `Business Studies/Chapter 2/Revision/Notes.pdf`
- The site automatically builds nested folders from this path.
- You can mix local files and Drive files in the same folder.


### Zero-manual update flow (autonomous)

- Just drag/drop or copy files into the correct repo subfolder (for example `Economics/Papers/...` or `Accounts/Worksheets/...`).
- Commit + push those files.
- The viewer auto-scans the GitHub repo tree and shows them automatically.
- No need to manually add local repo files in `files.json` anymore.

> `files.json` is now mainly for external links like Google Drive objects.
