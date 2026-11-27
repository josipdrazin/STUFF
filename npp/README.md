# Comment Bookmarks for Notepad++

A native `wxPython` dockable sidebar plugin for **Notepad++** (powered by the **PythonScript** plugin) that scans open files for special `BOOKMARK:` and `SECTION:` comments, providing instant multi-word filtering, sorting, and one-click line navigation.

---

## Features

* **Multi-Language Comment Scanning:** Automatically detects `BOOKMARK:` and `SECTION:` tags across common comment styles (`//`, `#`, `<#`, `/*`, and `--`).
* **Native Win32 Dockable Panel:** Docks directly into Notepad++'s Docking Manager (left, right, top, or bottom) via `NppDockablePanel` (`npp_dock.py`) with single-instance focus management.
* **Live Multi-Word Search:** Filter bookmarks instantaneously by tag, line number, or description keywords.
* **Flexible Sorting:** Sort entries by **Line Number**, **Tag (`BOOKMARK` / `SECTION`)**, or **Alphabetically**.
* **Auto-Refresh:** Automatically rescans the active buffer whenever you switch tabs (`BUFFERACTIVATED`) or save a file (`FILESAVED`).
* **Quick Bookmark Insertion:** Insert a properly prefixed `# BOOKMARK: ` or `// BOOKMARK: ` comment at the cursor based on the active file's extension.
* **Run on Startup Toggle:** Enable or disable automatic sidebar launch at Notepad++ startup directly from the panel's **Preferences** menu (persisted in `comments_bookmarks_config.json`).

---

## Requirements

* **Notepad++** (64-bit recommended)
* **PythonScript Plugin** for Notepad++ (Python 2.7.18 or compatible)
* **wxPython** (`wxPython 4.0.7.post2` for Python 2.7) installed into PythonScript's `site-packages` directory:
  ```cmd
  "C:\Python27\python.exe" -m pip install --target "C:\path\to\Notepad++\plugins\PythonScript\Lib\site-packages" "wxPython<4.1"
  ```

---

## Installation

1. Copy the following files into your Notepad++ user scripts folder (`plugins\Config\PythonScript\scripts\`):
   * `npp_dock.py` — Reusable Win32 / `wxPython` dockable panel base class.
   * `CommentsBookmarks.py` — Main sidebar UI, scanner, and preferences logic.
2. *(Optional)* To enable automatic startup on boot:
   * Open **Plugins -> Python Script -> Configuration...** in Notepad++ and set **Initialisation** to **`ATSTARTUP`**.
   * Add the following to your user `startup.py` (`plugins\Config\PythonScript\scripts\startup.py`):
     ```python
     import CommentsBookmarks

     if CommentsBookmarks.get_run_on_startup():
         CommentsBookmarks.show_sidebar(delay_sec=0.5)
     ```
3. Restart Notepad++.

---

## Usage

### Supported Comment Syntax
Add comments anywhere in your code using any supported comment prefix:

```javascript
// SECTION: Initialization
// BOOKMARK: Setup event listeners
```

```python
# SECTION: Data Processing
# BOOKMARK: Parse incoming payload
```

```powershell
<# BOOKMARK: Validate parameters #>
```

```sql
-- SECTION: User Queries
```

### Toolbar Controls
* **Search Box:** Type one or more space-separated terms to filter by tag, line number, or description.
* **Search Button:** Trigger/re-apply the current search filter.
* **Sort Button:** Switch between **Line Number**, **Tag**, and **Alphabetical** ordering.
* **Refresh Button:** Force a full rescan of the active document.
* **Preferences Button:**
  * Toggle **Run on Startup** (`comments_bookmarks_config.json`).
  * **Force Rescan Current File**.
  * **Insert Bookmark at Cursor**.
  * **Copy All Bookmarks to Clipboard**.

### Keyboard Shortcuts (Optional)
You can bind `CommentsBookmarks` (to open/focus the sidebar) or a wrapper calling `CommentsBookmarks.insert_bookmark_at_cursor()` to any hotkey via:
1. **Plugins -> Python Script -> Configuration...** -> Add script under **Menu items** -> Restart Notepad++.
2. **Settings -> Shortcut Mapper... -> Plugin commands**.

---

## File Structure

```text
plugins/Config/PythonScript/scripts/
├── npp_dock.py                      # Base class for Notepad++ Win32 dockable wx.Frames
├── CommentsBookmarks.py             # Comment scanner, ListCtrl UI, and event listeners
├── comments_bookmarks_config.json   # Auto-generated preferences file (run_on_startup)
└── startup.py                       # Optional Notepad++ boot hook
```
