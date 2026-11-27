import base64, json, io, os, re, wx
from Npp import notepad, editor, NOTIFICATION
from npp_dock import NppDockablePanel

COMMENT_REGEX = re.compile(
    r"(?:\/\/|<#|#|\/\*|--)\s*(BOOKMARK|SECTION):\s*((?:[^\r\n*#]|\*(?!\/)|#(?!>))*)",
    re.IGNORECASE
)

ICONS_B64 = {
    "bookmark": "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFBSURBVChThVK/S8NAGH25RiimdBARQRAcHHTSUQpO/gVODv4XWgIWm6GpVgo1WHBwdhRRN1dHi0uWOiloqTa0wVC4/uJ6XuJFghF98PHd3ffe9x33TrFtm09qGgAuQhERQuzDI5n7vT6UluPwVCD4H5RSkGhPH4wxFPaOUC2dBuufIP60EGPOYehF1G88zLgrqJgnMdH3BC7I+WwBD9ce3mgTt/dJTHUysMyqaDSWLCGQGbs7ZVyca2B8FfOpJaS5iqc6wePdBoq5M8mKCBgbgA5ddIcM73QRc+kPdGgSXvsZbOBJVkRQOc5haxtQ2ZW4UgPtro1R7xIL6zXky1nJiggIIShZBaxtLmNWfUHTbWE6M8KBZQS1EIojfNAiPvivYugmVDKB/UMdiURCVr58iAn+QiB4bTR+dZrHvgrQoxSfR8eMDpy8I5cAAAAASUVORK5CYII=",
    "search":   "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABdklEQVRIx+3VoU9bURQG8F8DrgG5pAKDWermhkJUFTI3QYJpUjk/sz8BgZ2bIRlDLDPDMrmJCWACVQSbKJlZIISxZXTma9K9vL4WQjLDl9zk5dzzfee8e849l3vcAdrYQg+/snqxraBWRa7abOIVHuM79nCcvUW08ACf0MXRTbJu4Qx9dDBb4jObvX58W9OKN0M4QCO2OpbwCDMF/wb2w2lOEq/hY7Iair/AOQZZJ3hSEqQfbm1SQQf59aH4NXawijV8xm8sF7idcFeqAmzhNOdbT+Y7BZ96uuhDSU1OozEWPWzneykZrZb4beCyxL4djX+ijmIBb/L9MwHmSoTmcFViP8bTqgCj+IJveI73uIj9IdaxO4Y3qArwNZcI/uAZ3uEQb5P5OubTlkUsJqmpijzEcgp6iR94jZfprs2bFrkdYmeKC7kZ3+5Im15HoxLFi1aFbo5l9KLdalRUoRHfqUbFnQ+7/zauxz04V4UHpz1puN1jIv4CviFqfyis9vMAAAAASUVORK5CYII=",
    "sort":     "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA2ElEQVRIx+2U0Q2CQAyGvxIcwCWM2+hCStzBbZiEDXhiAZX6UpLLBcrJnW/8SZMe0P9vS6+wYyMuQA+MZj1wXfhWgI+ZpApM5FOg2rMiAmFAZWd1CFyBOrEi3drreqWSV+DrPwQkJ/s1gdHeq/lFBXTmrCXvgUQTIc4IZk2R5GZaO9MjM206/Nqq2sm8Cogl50d7OAGDkT9L7iKAI9AZeTtTrQSVxqtFUlrXWns6E4txC4jHaDne1wSeFjAAZyerJiCfrEndphpl9U4QabbeA2+KHgv+jjR8AR+ySqzd1clZAAAAAElFTkSuQmCC",
    "refresh":  "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABb0lEQVRIx93VPUtcQRQG4EcNsRNiI2ZBQWwi6SSkSREIWFuaysrKyj9g7Z8QLNbGKraCnY2EaBdIl7CJIkSRsBa6KGneYrneq3f9CMQDAzPnvHO+5wz/O/XVwDQwizd4Gd4BPmMTP+9qvIEmOrhCCztZrfA6wTR6VT6DE7SxgskSzGRk7WBnelF+jj1M1MBPBHtex0gj3uxhqEQ+h4US/lDunNyWrmZCrvJ8HpdYqoikHR2V3neS17J8r+IbLlLgjyW4legojWIxF4sFfYc/2McyfuMU0xWOXEXXNVpL+3XTc3zHBgbi4Sne3pDmVnRdo630eLGjLjGa8xRed8lflDzWnegCz27pqnEc4zDnrwX5l6StsrDdBg7woSTcYYzgqCAbwVhqUnRqu26RB2NkHf1d/P7wWsHUKnJVm77HGXbT/0vZn0VWu01vemivIvuR1Qyvp4dWZ1RUUe1R8ejD7p+M6wf9cO77ZX7CL0+a/gIqU3PxAoDTgQAAAABJRU5ErkJggg==",
    "prefs":    "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABWElEQVRIx8WVsWoCQRCGv4PzBQQRq+CbxDSCV1j4Blpa5AXS5QFSnG8QSKpUYlIL9lqJz6FgvOYuzUSWZXZvTzZkYLjbvZn5Z2b/nYM/liTQ7gnIrL1P4DlWIlugEi3luYtZ6VECm3q6JdAdMAfaxt7YyN6soAQmhl0HeAT6PoClOJ+BV1mXHoAK+ALegIusV67gQ6UNt+rIDt4C9kqWVUAF2vtBYl5lWuNQALlQNQMWsudLaGYC9ICNo9wCuFda+iDfNJ810NXalCsZ5R5SLBT7FyB1ObSVbDIPQKbYmxRXkRLJJGkwboLsUymvSYtcLW3Zhl05GI0VBTBQgg8MJtks2ghxrjKruTg2TXMPg351ajPoEPGi7bU2jSICDF2HthKDC/Aug6xu7ixlMJ6NtVP6MnI7xt7EU8HYukNzGfmN5aQAHGP+0XZKa7YhjmkgwAfwrZzX/8sP7iL3QyTxDqcAAAAASUVORK5CYII=",
}

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "comments_bookmarks_config.json")

def b64_to_bitmap(b64_str, size=(16, 16)):
    raw = base64.b64decode(b64_str)
    img = wx.Image(io.BytesIO(raw))
    if size:
        w, h = size
        if img.GetWidth() != w or img.GetHeight() != h:
            img = img.Scale(w, h, wx.IMAGE_QUALITY_HIGH)
    return wx.Bitmap(img)

def get_run_on_startup():
    try:
        with open(CONFIG_PATH, "r") as f:
            return bool(json.load(f).get("run_on_startup", True))
    except Exception:
        return True  # Default: enabled

def set_run_on_startup(enabled):
    try:
        with open(CONFIG_PATH, "w") as f:
            json.dump({"run_on_startup": bool(enabled)}, f, indent=2)
    except Exception:
        pass

class CommentBookmarksPanel(NppDockablePanel):
    PANEL_NAME = u"Comment Bookmarks"
    DOCKING = "right"
    DEFAULT_SIZE = (280, 500)

    def __init__(self):
        super(CommentBookmarksPanel, self).__init__()
        self.bookmarks_list = []
        self.displayed_items = []
        self.sort_mode = "line"

        root = wx.Panel(self)
        root.SetBackgroundColour(wx.Colour(245, 245, 245))
        vbox = wx.BoxSizer(wx.VERTICAL)

        tbar = wx.BoxSizer(wx.HORIZONTAL)
        self.search_input = wx.TextCtrl(root, style=wx.TE_PROCESS_ENTER)
        self.search_input.SetHint(u"Search...")
        tbar.Add(self.search_input, 1, wx.RIGHT | wx.ALIGN_CENTER_VERTICAL, 4)

        btn_specs = [
            ("search",  u"Search",          self.on_search),
            ("sort",    u"Sort",            self.on_sort_menu),
            ("refresh", u"Refresh Entries", self.on_refresh),
            ("prefs",   u"Preferences",     self.on_prefs_menu),
        ]
        for key, tip, handler in btn_specs:
            btn = wx.BitmapButton(root, bitmap=b64_to_bitmap(ICONS_B64[key], (16, 16)), size=(24, 24))
            btn.SetToolTip(tip)
            btn.Bind(wx.EVT_BUTTON, handler)
            tbar.Add(btn, 0, wx.LEFT, 2)

        vbox.Add(tbar, 0, wx.ALL | wx.EXPAND, 6)

        self.list_ctrl = wx.ListCtrl(
            root,
            style=wx.LC_REPORT | wx.LC_SINGLE_SEL | wx.BORDER_SIMPLE
        )
        self.img_list = wx.ImageList(12, 12)
        self.bm_icon_idx = self.img_list.Add(b64_to_bitmap(ICONS_B64["bookmark"], (12, 12)))
        self.list_ctrl.AssignImageList(self.img_list, wx.IMAGE_LIST_SMALL)

        self.list_ctrl.InsertColumn(0, u"Description", width=160)
        self.list_ctrl.InsertColumn(1, u"Line", width=48)
        self.list_ctrl.InsertColumn(2, u"Tag", width=78)

        vbox.Add(self.list_ctrl, 1, wx.LEFT | wx.RIGHT | wx.BOTTOM | wx.EXPAND, 6)
        root.SetSizer(vbox)

        self.search_input.Bind(wx.EVT_TEXT, self.on_search)
        self.search_input.Bind(wx.EVT_TEXT_ENTER, self.on_search)
        self.list_ctrl.Bind(wx.EVT_LIST_ITEM_SELECTED, self.on_item_click)
        self.list_ctrl.Bind(wx.EVT_LIST_ITEM_ACTIVATED, self.on_item_click)
        self.Bind(wx.EVT_SIZE, self.on_resize)

        self._register_npp_listeners()

    def on_resize(self, event):
        event.Skip()
        w = self.list_ctrl.GetClientSize().width
        if w > 140:
            self.list_ctrl.SetColumnWidth(2, w - 130)

    def on_panel_shown(self):
        self.refresh_bookmarks(True)

    def _register_npp_listeners(self):
        notepad.clearCallbacks(self._on_npp_event)
        notepad.callback(self._on_npp_event, [
            NOTIFICATION.BUFFERACTIVATED,
            NOTIFICATION.FILESAVED
        ])

    def _on_npp_event(self, args):
        if self.IsShown():
            wx.CallAfter(self.refresh_bookmarks, True)

    def jump_to_line(self, line_index):
        total = editor.getLineCount()
        if line_index < 0 or line_index >= total:
            return
        max_line = total - 1
        screen_offset = 35
        editor.gotoLine(0)
        editor.gotoLine(min(max_line, line_index + screen_offset))
        editor.gotoLine(line_index)
        editor.grabFocus()

    def on_item_click(self, event):
        idx = event.GetIndex()
        if 0 <= idx < len(self.displayed_items):
            self.jump_to_line(self.displayed_items[idx]["line"])

    def render_bookmarks(self, items):
        self.displayed_items = items
        self.list_ctrl.Freeze()
        self.list_ctrl.DeleteAllItems()
        if not items:
            row = self.list_ctrl.InsertItem(0, u"")
            self.list_ctrl.SetItem(row, 2, u"No special comments found.")
            self.list_ctrl.Thaw()
            return

        for i, bm in enumerate(items):
            row = self.list_ctrl.InsertItem(i, u"%s" % bm["desc"], self.bm_icon_idx)
            self.list_ctrl.SetItem(row, 1, unicode(bm["line"] + 1))
            self.list_ctrl.SetItem(row, 2, u"[%s]" % bm["tag"])
            if bm["tag"] == "SECTION":
                self.list_ctrl.SetItemTextColour(row, wx.Colour(0, 102, 204))
        self.list_ctrl.Thaw()

    def refresh_bookmarks(self, force_rescan=True):
        self.search_input.ChangeValue(u"")
        if force_rescan or not self.bookmarks_list:
            self.bookmarks_list = []
            text = editor.getText().decode("utf-8", "replace")
            for i, line_text in enumerate(text.splitlines()):
                match = COMMENT_REGEX.search(line_text)
                if match:
                    tag = match.group(1).upper()
                    desc = (match.group(2) or u"").strip()
                    self.bookmarks_list.append({
                        "line": i,
                        "tag": tag,
                        "desc": desc,
                        "search_text": u"%s line %d %s" % (tag.lower(), i + 1, desc.lower())
                    })
        self._apply_sort()
        self.render_bookmarks(self.bookmarks_list)

    def _apply_sort(self):
        if self.sort_mode == "line":
            self.bookmarks_list.sort(key=lambda b: b["line"])
        elif self.sort_mode == "tag":
            self.bookmarks_list.sort(key=lambda b: (b["tag"], b["line"]))
        elif self.sort_mode == "desc":
            self.bookmarks_list.sort(key=lambda b: b["desc"].lower())

    def on_search(self, event):
        query = self.search_input.GetValue().strip().lower()
        if not query:
            self.render_bookmarks(self.bookmarks_list)
            return
        words = query.split()
        filtered = [
            bm for bm in self.bookmarks_list
            if all(w in bm["search_text"] for w in words)
        ]
        self.render_bookmarks(filtered)

    def on_sort_menu(self, event):
        menu = wx.Menu()
        modes = [
            ("line", u"Sort by Line Number"),
            ("tag",  u"Sort by Tag (BOOKMARK / SECTION)"),
            ("desc", u"Sort Alphabetically"),
        ]
        for mode, label in modes:
            item = menu.AppendRadioItem(wx.ID_ANY, label)
            if self.sort_mode == mode:
                item.Check(True)
            self.Bind(wx.EVT_MENU, lambda e, m=mode: self._set_sort(m), item)
        self.PopupMenu(menu)
        menu.Destroy()

    def on_refresh(self, event):
        self.refresh_bookmarks(True)

    def _set_sort(self, mode):
        self.sort_mode = mode
        self._apply_sort()
        self.on_search(None)

    def on_prefs_menu(self, event):
        menu = wx.Menu()
        item_startup = menu.AppendCheckItem(wx.ID_ANY, u"Run on Startup")
        item_startup.Check(get_run_on_startup())
        menu.AppendSeparator()
        item1 = menu.Append(wx.ID_ANY, u"Force Rescan Current File")
        item2 = menu.Append(wx.ID_ANY, u"Insert Bookmark at Cursor")
        item3 = menu.Append(wx.ID_ANY, u"Copy All Bookmarks to Clipboard")

        self.Bind(wx.EVT_MENU, self._toggle_run_on_startup, item_startup)
        self.Bind(wx.EVT_MENU, lambda e: self.refresh_bookmarks(True), item1)
        self.Bind(wx.EVT_MENU, lambda e: insert_bookmark_at_cursor(), item2)
        self.Bind(wx.EVT_MENU, self._copy_all, item3)
        self.PopupMenu(menu)
        menu.Destroy()

    def _toggle_run_on_startup(self, event):
        set_run_on_startup(event.IsChecked())

    def _copy_all(self, event):
        lines = [u"[%s] Line %d: %s" % (b["tag"], b["line"] + 1, b["desc"]) for b in self.bookmarks_list]
        if wx.TheClipboard.Open():
            wx.TheClipboard.SetData(wx.TextDataObject(u"\r\n".join(lines)))
            wx.TheClipboard.Close()

def show_sidebar(delay_sec=0.0):
    CommentBookmarksPanel.show_or_focus(delay_sec=delay_sec)
    
def insert_bookmark_at_cursor():
    ext = os.path.splitext(notepad.getCurrentFilename())[1].lower()
    prefix = "# " if ext in (".ps1", ".psm1", ".psd1", ".py", ".sh", ".yml", ".yaml") else "// "
    editor.replaceSel(prefix + "BOOKMARK: ")
    editor.grabFocus()
    inst = CommentBookmarksPanel.get_instance()
    if inst and inst.IsShown():
        wx.CallAfter(inst.refresh_bookmarks, True)
        
if __name__ == "__main__":
    #show_sidebar(delay_sec=0.0)
    pass