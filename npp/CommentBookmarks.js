(function () {
		// Removed trailing $ so \r\n line endings from view.lines.get(i).text never block a match
	var COMMENT_REGEX = /(?:\/\/|<#|#|\/\*|--)\s*(TODO|FIXME|BOOKMARK|SECTION):?\s*([^\r\n#*]*)/i;


	var dock = null;
	var listContainer = null;

	function jumpToLine(lineIndex) {
		var view = Editor.currentView;
		if (!view || lineIndex >= view.lines.count) return;

		var maxLine = view.lines.count - 1;
		var screenOffset = 35;

		view.line = 0;
		view.line = Math.min(maxLine, lineIndex + screenOffset);
		view.line = lineIndex;
	}
sasdasdasd// SECTION: some Section start
//BOOKMARK:s asdasd
// bookmark: Database connection setup
# SECTION: User Authentication
/* TODO: Refactor this loop */
<!-- FIXME: Handle null values

/* TODO: Refactor this loop */
	function refreshBookmarks() {
		if (!listContainer || !dock) return;
		listContainer.innerHTML = "";

		var view = Editor.currentView;
		if (!view) return;

		var count = view.lines.count;
		var found = 0;

		for (var i = 0; i < count; i++) {
			var lineText = view.lines.get(i).text;
			var match = COMMENT_REGEX.exec(lineText);

			if (match) {
				found++;
				var tag = match[1].toUpperCase();
				var desc = (match[2] || "").replace(/</g, "&lt;");

				var item = dock.document.createElement("div");
				item.className = "bookmark-item";
				item.innerHTML =  "<span class='tag'>[" + tag + "]</span> "+"<span class='line-num'>Line " + (i + 1) + "</span><br />"+"<span class='icon'></span> " +
					"<span class='desc'>" + desc + "</span>";

				(function (targetLine) {
					item.onclick = function () {
						jumpToLine(targetLine);
					};
				})(i);

				listContainer.appendChild(item);
			}
		}

		if (found === 0) {
			listContainer.innerHTML = "<div class='empty'>No special comments found.</div>";
		}
	}

	function showSidebar() {
		if (dock) {
			dock.visible = true;
			refreshBookmarks();
			return;
		}

		dock = Editor.createDockable({
			name: "Comment Bookmarks",
			docking: "right",
			onbeforeclose: function () {
				dock.visible = false;
				return false;
			},
			onclose: function () {}
		});

		var doc = dock.document;
		doc.open();
		doc.write(
			"<html><head><style>" +
			"body { font-family: Segoe UI, Tahoma, sans-serif; font-size: 12px; margin: 0; padding: 6px; background: #f5f5f5; }" +
			".toolbar { margin-bottom: 6px; }" +
			"button { width: 100%; padding: 4px; cursor: pointer; }" +
			".bookmark-item { padding: 5px 6px; margin-bottom: 4px; background:  b; border: 1px solid #ddd; cursor: pointer; }" +
			".bookmark-item:hover { background: #e6f2ff; border-color: #99caff; }" +
			".line-num { color: #666; font-weight: bold; }" +
			".tag { color: #0066cc; font-weight: bold; }" +
			".empty { color: #888; font-style: italic; padding: 8px; }" +
			".icon { display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFBSURBVChThVK/S8NAGH25RiimdBARQRAcHHTSUQpO/gVODv4XWgIWm6GpVgo1WHBwdhRRN1dHi0uWOiloqTa0wVC4/uJ6XuJFghF98PHd3ffe9x33TrFtm09qGgAuQhERQuzDI5n7vT6UluPwVCD4H5RSkGhPH4wxFPaOUC2dBuufIP60EGPOYehF1G88zLgrqJgnMdH3BC7I+WwBD9ce3mgTt/dJTHUysMyqaDSWLCGQGbs7ZVyca2B8FfOpJaS5iqc6wePdBoq5M8mKCBgbgA5ddIcM73QRc+kPdGgSXvsZbOBJVkRQOc5haxtQ2ZW4UgPtro1R7xIL6zXky1nJiggIIShZBaxtLmNWfUHTbWE6M8KBZQS1EIojfNAiPvivYugmVDKB/UMdiURCVr58iAn+QiB4bTR+dZrHvgrQoxSfR8eMDpy8I5cAAAAASUVORK5CYII=')  no-repeat center center; color: #0066cc; font-size: 11px; margin: 0 2px; }" +
			"</style></head><body>" +
			"<div class='toolbar'><button id='refreshBtn'>Refresh List</button></div>" +
			"<div id='list'></div>" +
			"</body></html>"
		);
		doc.close();

		listContainer = doc.getElementById("list");
		doc.getElementById("refreshBtn").onclick = refreshBookmarks;

		refreshBookmarks();
	}
	
	function insertBookmarkAtCursor() {
		var view = Editor.currentView;
		if (!view) return;
		var path = (view.files && view.files[view.file]) ? view.files[view.file].toLowerCase() : "";
		var prefix = /\.(ps1|psm1|psd1|py|sh|yml|yaml)$/.test(path) ? "# " : "// ";
		view.selection = prefix + "BOOKMARK: ";
		refreshBookmarks();
	}

	var menu = Editor.addMenu("Comment Bookmarks");
	menu.addItem({
		text: "Show Comment Bookmarks",
		cmd: showSidebar
	});
	menu.addItem({
	text: "Insert Bookmark Comment at Cursor",
	cmd: insertBookmarkAtCursor
});
	// Use setTimeout (300ms) instead of addIdleHandler so Notepad++ finishes loading UI and tabs first
	System.setTimeout({
		millis: 300,
		cmd: showSidebar
	});
	Editor.setListener({
		BUFFERACTIVATED: function () { if (dock && dock.visible) refreshBookmarks(); },
		FILESAVED: function () { if (dock && dock.visible) refreshBookmarks(); }
	});

})();
