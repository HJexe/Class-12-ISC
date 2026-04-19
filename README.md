# 📚 Hrishi's Resource Library (Class-12-ISC)

A web-based resource library for Class 12 ISC students to access and view educational materials including PDFs, question papers, MCQs, and important study resources.

## 🌐 Live Demo

[View Live Site](https://hjexe.github.io/Class-12-ISC/)

## 📖 Overview

This project provides a clean, modern interface for browsing and viewing Class 12 ISC study materials. Resources are organized by subject and can be previewed directly in the browser or opened in a new tab.

## ✨ Features

- **Subject-Based Organization**: Resources categorized by subject (Economics, Accounts, Business Studies, Commerce)
- **PDF Preview**: View PDFs directly in the browser without downloading
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes with a modern dark UI
- **Accordion Navigation**: Collapsible folder structure for easy browsing
- **GitHub-Powered**: Resources fetched dynamically from GitHub repository

## 📁 Project Structure

```
Class-12-ISC/
├── index.html              # Main application (single-page app)
├── Economics/              # Economics resources
│   ├── Important Questions/
│   │   ├── CLASS XII ECONOMICS MCQS.pdf
│   │   ├── HOTS QUESTION.pdf
│   │   ├── IMPORTANT.QUESTIONS[ macro ].pdf
│   │   └── National Income MCQs.pdf
│   ├── Papers/             # Past exam papers
│   └── test.txt
├── Accounts/               # Accountancy resources
├── Business Studies/       # Business Studies resources
└── Commerce/               # Commerce resources
```

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS Grid, Flexbox, and CSS Variables
- **Vanilla JavaScript** - No frameworks, pure JS for dynamic content
- **GitHub API** - Fetches repository tree and file listing
- **GitHub Pages** - Hosting platform

## 🚀 Getting Started

### Prerequisites

- A GitHub account
- Git installed locally (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HJexe/Class-12-ISC.git
   cd Class-12-ISC
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     ```

3. **Deploy to GitHub Pages** (if creating your own instance)
   - Push your repository to GitHub
   - Go to Settings → Pages
   - Select your branch and save

## 📝 Usage

1. **Browse Subjects**: Click on subject folders in the left panel to expand/collapse
2. **View Resources**: Click on any PDF file to preview it in the right panel
3. **Open in New Tab**: Use the "Open in new tab" button to view the full PDF
4. **Navigate**: Use the accordion controls to switch between subjects

## 🎨 Customization

### Adding New Subjects

Edit the `SUBJECT_FOLDERS` array in `index.html`:

```javascript
const SUBJECT_FOLDERS = [
  "Economics",
  "Accounts",
  "Business Studies",
  "Commerce",
  "Your Subject Here"  // Add new subjects
];
```

### Changing Colors

Modify the CSS variables in the `:root` section:

```css
:root {
  --bg: #0b0d10;      /* Background */
  --fg: #e6e9ef;      /* Foreground text */
  --muted: #9aa4b2;   /* Muted text */
  --accent: #4da3ff;  /* Accent color */
  --card: #13161a;    /* Card background */
  --border: #1d2228;  /* Border color */
}
```

## 📄 Supported File Types

Currently optimized for:
- PDF documents (.pdf)

The system can be extended to support other file types by modifying the filter in the `loadResources()` function.

## 🔧 Configuration

Update these constants in `index.html` to point to your repository:

```javascript
const OWNER = "HJexe";
const REPO = "Class-12-ISC";
```

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Content Guidelines

When adding resources:
- Use descriptive filenames
- Organize files in appropriate subject folders
- Keep file sizes reasonable for web viewing
- Ensure you have the right to share the content

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Hrishi** (HJexe)

## 🙏 Acknowledgments

- Icons and design inspiration from various open-source projects
- Powered by GitHub Pages and GitHub API

---

**Happy Learning! 📖✨**
