# Python & Windows Automation Utilities

A collection of lightweight desktop tools, editor plugins, file-management utilities, and cross-language ports built in **Python** and **PowerShell**.

---

## Featured Projects

### 1. Notepad++ Comment Bookmarks Plugin (`Python`, `wxPython`, `Win32 API`)
A native dockable sidebar panel for **Notepad++** (via PythonScript) that indexes special comment tags (`BOOKMARK:` and `SECTION:`) across multiple programming languages (`//`, `#`, `<#`, `/*`, `--`).
* **Win32 Docking Integration:** Uses `ctypes` and Notepad++ window messages (`NPPM_DMMREGASDCKDLG`) to natively dock inside the editor workspace without blocking the UI thread.
* **Live Filtering & Sorting:** Instant keyword search, sorting by line number, tag type, or alphabetical description, and one-click jump-to-line navigation.
* **Built-in Utilities:** Includes quick bookmark insertion at cursor, clipboard export, and persistent JSON startup settings.

### 2. Automated File Organizer & Rollback Engine (`Python` & `PowerShell`)
A dual-implementation CLI and GUI utility designed to clean up cluttered directories safely.
* **Top-Level & Recursive Sorting:** Automatically groups files into subfolders based on file extensions (`organize_dir` and `organize_dir_tree`).
* **Collision-Safe Moves:** Automatically appends incremental numbering (`file(1).ext`) to prevent accidental overwrites.
* **Full Rollback Support:** Generates structured audit reports (`report.txt`) tracking every original and destination path, allowing one-click restoration of all moved files and cleanup of empty directories.

### 3. Sweet Match — Desktop Puzzle Game (`PowerShell`, `.NET WinForms`, `WPF`)
A native Windows Match-3 puzzle game ported from JavaScript into object-oriented PowerShell.
* **Custom Rendering:** Uses GDI+ gradient brushes, drop-shadow typography, and WPF `BitmapDecoder` to render `.webp` assets inside Windows Forms.
* **Game Systems:** Modular architecture featuring horizontal/vertical match detection, cascading gravity physics, level progression bars, and dynamic difficulty scaling.

### 4. Windows Shell & Web Asset Utilities (`Python`)
* **Folder Size Calculator:** Designed for Windows Explorer context-menu integration; recursively calculates directory size with graceful permission-error handling and displays human-readable totals (`B` to `PB`) in a native dialog.
* **Web Asset Bundler:** Traverses project subdirectories to consolidate `.html`, `.css`, and `.js` source files into single-file bundles annotated with relative file headers.

---

## Tech Stack
* **Languages:** Python 3, PowerShell, JavaScript
* **GUI & Windows Integration:** `wxPython`, `tkinter`, `.NET Windows Forms`, `WPF`, Win32 `ctypes`
* **Core Libraries:** `pathlib`, `argparse`, `re`, `json`, `mimetypes`, `shutil`

---

## Quick Usage Examples

### File Organizer (Python CLI)
```bash
# Sort top-level files by extension
python core.py "C:\Path\To\Folder"

# Recursively sort only PDF files
python core.py "C:\Path\To\Folder" --ext .pdf --recursive

# Undo a previous organization using its generated report
python core.py "C:\Path\To\Folder" --undo "C:\Path\To\Folder\organize_dir_tree - report.txt"
```

### Folder Size Calculator
```bash
python folder_size.py "C:\Path\To\TargetFolder"
```

---

## Notes
* Before running scripts that modify files, always test on a sample directory or keep the generated `*- report.txt` file to enable full rollback.
