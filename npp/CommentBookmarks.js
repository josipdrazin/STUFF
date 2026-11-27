// BOOKMARK: goto TOP

function TemplateDockablePanel(opts) {
	var self = this;
	opts = opts || {};

	this.dock = Editor.createDockable({
		name: opts.name || "Custom Panel",
		docking: opts.docking || "right",
		onbeforeclose: function() {
			if (opts.onbeforeclose) {
				return opts.onbeforeclose.call(self);
			}
			self.dock.visible = false;
			return false;
		},
		onclose: function() {
			if (opts.onclose) opts.onclose.call(self);
		}
	});
	self.prototype.name = opts.name || "Custom Panel";
	var doc = this.dock.document;
	var win = doc.parentWindow;

	// Expose document & window directly on your template instance
	this.document = doc;
	this.window = win;

	
	

	// Optional: expose outer JS functions to HTML inline events as window.nppBridge
	if (opts.bridge) {
		win.nppBridge = opts.bridge;
	}

	doc.open();
	doc.write(
		'<!DOCTYPE html>' +
		'<html><head>' +
		'<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
		'<style>' + (opts.css || '') + '</style>' +
		'</head><body>' +
		(opts.html || '') +
		'<script>' +
		'window._jnEval = function(c) { try { return eval("(" + c + ")"); } catch(e) { return eval(c); } };' +
		// Disable IE right-click menu, F5/Ctrl+R refresh, Backspace back, drag, and accidental selection
		'document.oncontextmenu = function() { return false; };' +
		'document.onkeydown = function(e) {' +
			'e = e || window.event;' +
			'var k = e.keyCode || e.which;' +
			'var t = (e.target || e.srcElement).tagName.toUpperCase();' +
			'var isInput = (t === "INPUT" || t === "TEXTAREA" || t === "SELECT");' +
			'if (k === 116 || (e.ctrlKey && k === 82)) { e.keyCode = 0; e.returnValue = false; return false; }' +
			'if (k === 8 && !isInput) { e.returnValue = false; return false; }' +
		'};' +
		'document.onselectstart = function(e) {' +
			'e = e || window.event;' +
			'var t = (e.target || e.srcElement).tagName.toUpperCase();' +
			'return (t === "INPUT" || t === "TEXTAREA");' +
		'};' +
		'document.ondragstart = function() { return false; };' +
		(opts.script || '') +
		'<\/script>' +
		'</body></html>'
	);
	doc.close();
	// Built-in DOM helpers scoped automatically to this panel's document
	this.byId = function(id) {
		return self.enhance(doc.getElementById(id));
	};

	this.byClass = function(cls, root) {
		root = root || doc;
		var matched = [], all = root.getElementsByTagName("*");
		for (var i = 0; i < all.length; i++) {
			if ((" " + all[i].className + " ").indexOf(" " + cls + " ") !== -1) {
				matched.push(all[i]);
			}
		}
		return self.enhance(matched);
	};

	this.enhance = function(target) {
		if (!target) return target;
		if (typeof target.length === "number" && !target.nodeType) {
			var list = [];
			for (var i = 0; i < target.length; i++) {
				list.push(self.enhance(target[i]));
			}
			list.on = function(eventName, handler) {
				for (var j = 0; j < this.length; j++) {
					this[j]["on" + eventName] = handler;
				}
				return this;
			};
			return list;
		}

		var el = target;
		if (el.classList) return el;

		function getClasses() {
			var trimmed = (el.className || "").replace(/^\s+|\s+$/g, "");
			return trimmed ? trimmed.split(/\s+/) : [];
		}
		function indexOf(arr, item) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] === item) return i;
			}
			return -1;
		}

		el.classList = {
			contains: function(cls) { return indexOf(getClasses(), cls) !== -1; },
			add: function(cls) {
				var c = getClasses();
				if (indexOf(c, cls) === -1) { c.push(cls); el.className = c.join(" "); }
			},
			remove: function(cls) {
				var c = getClasses(), idx = indexOf(c, cls);
				if (idx !== -1) { c.splice(idx, 1); el.className = c.join(" "); }
			},
			toggle: function(cls) {
				if (this.contains(cls)) { this.remove(cls); return false; }
				this.add(cls); return true;
			}
		};

		el.index = function() {
			var idx = 0, curr = el;
			while ((curr = curr.previousSibling) !== null) {
				if (curr.nodeType === 1) idx++;
			}
			return idx;
		};

		return el;
	};

}

// BOOKMARK: TemplateDockablePanel.proto...

TemplateDockablePanel.prototype.show = function() {
	this.dock.visible = true;
};

TemplateDockablePanel.prototype.hide = function() {
	this.dock.visible = false;
};

TemplateDockablePanel.prototype.toggleVisibility = function() {
	if (!this.dock.visible) { this.dock.visible = true; }
	else { this.dock.visible = false; }
};

TemplateDockablePanel.prototype.prototype = TemplateDockablePanel.prototype;

(function() {

	// Removed trailing $ so \r\n line endings from view.lines.get(i).text never block a match
	var COMMENT_REGEX = /(?:\/\/|<#|#|\/\*|--)\s*(BOOKMARK|SECTION):\s*((?:[^\r\n*#]|\*(?!\/)|#(?!>))*)/i;

	var dock = null;
	var listContainer = null;
	var bookmarksList = [];
	var panel = null;
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
	
	function startsWith(src, str) {
		return src.indexOf(str) === 0;
	}

	function endsWith(src, str) {
		if (str.length > src.length) return false;
		return src.slice(src.length - str.length) === str;
	}

	function sortBookmarks(mode){ }

	function createBookmarkElement(bm) {
		var item = dock.document.createElement("div");
		item.className = "bookmark-item";
		item.innerHTML =
			"<span class='tag'>[" + bm.tag + "]</span> " +
			"<span class='line-num'>Line " + (bm.line + 1) + "</span><br />" +
			"<span class='icon'></span> " +
			"<span class='desc'>" + bm.desc + "</span>";

		item.onclick = function () {
			jumpToLine(bm.line);
		};
		return item;
	}

	function renderBookmarks(items) {
		listContainer.innerHTML = "";
		if (items.length === 0) {
			listContainer.innerHTML = "<div class='empty'>No special comments found.</div>";
			return;
		}
		for (var i = 0; i < items.length; i++) {
			listContainer.appendChild(createBookmarkElement(items[i]));
		}
	}
// BOOKMARK: refreshBookmarks
	function refreshBookmarks(forceRescan) {
		if (!listContainer || !dock) return;
		panel.byId("searchInput").value = "";

		if (forceRescan || bookmarksList.length === 0) {
			bookmarksList = [];
			var view = Editor.currentView;
			if (!view) return;

			var count = view.lines.count;
			for (var i = 0; i < count; i++) {
				var lineText = view.lines.get(i).text;
				var match = COMMENT_REGEX.exec(lineText);

				if (match) {
					var tag = match[1].toUpperCase();
					var desc = (match[2] || "").replace(/^\s+|\s+$/g, "").replace(/</g, "&lt;");
					bookmarksList.push({
						line: i,
						tag: tag,
						desc: desc,
						searchText: (tag + " line " + (i + 1) + " " + desc).toLowerCase()
					});
				}
			}
		}

		renderBookmarks(bookmarksList);
	}

	function searchInBookMarks() {
		if (!listContainer || !dock) return;

		var query = panel.byId("searchInput").value.replace(/^\s+|\s+$/g, "").toLowerCase();
		if (!query) {
			renderBookmarks(bookmarksList);
			return;
		}

		var words = query.split(/\s+/);
		var filtered = [];

		for (var i = 0; i < bookmarksList.length; i++) {
			var text = bookmarksList[i].searchText;
			var isMatch = true;

			for (var w = 0; w < words.length; w++) {
				if (text.indexOf(words[w]) === -1) {
					isMatch = false;
					break;
				}
			}
			if (isMatch) filtered.push(bookmarksList[i]);
		}

		renderBookmarks(filtered);
	}

	function toggleHidden(el) {
		el.classList.toggle("element-display-block");
		el.classList.toggle("element-display-none");
	}
	
// BOOKMARK: showSidebar();	
	function showSidebar() {
		if (panel) {
			panel.show();
			refreshBookmarks();
			return;
		}

		panel = new TemplateDockablePanel({
			name: "Comment Bookmarks",
			docking: "right",
			css:
				"body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; margin: 0; padding: 6px; background: #f5f5f5; }" +
				".hidden { display: none; }" +
				".toolbar { margin-bottom: 6px; }" +
				".bookmark-item { padding: 2px; margin-bottom: 2px; background: #ffffff; border: 1px solid #ddd; cursor: pointer; }" +
				".bookmark-item:hover { background-color: #64C4F7; border-color: #0059DF;  }" +
				".bookmark-item:active { background-color: #3399FF; border-color: #0059DF;  }"+
				".line-num { color: #666; font-weight: bold; }" +
				".tag { font-size: 9px; color: #0066cc; font-weight: bold; }" +
				".empty { color: #888; font-style: italic; padding: 8px; }" +
				".icon { display: inline-block; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFBSURBVChThVK/S8NAGH25RiimdBARQRAcHHTSUQpO/gVODv4XWgIWm6GpVgo1WHBwdhRRN1dHi0uWOiloqTa0wVC4/uJ6XuJFghF98PHd3ffe9x33TrFtm09qGgAuQhERQuzDI5n7vT6UluPwVCD4H5RSkGhPH4wxFPaOUC2dBuufIP60EGPOYehF1G88zLgrqJgnMdH3BC7I+WwBD9ce3mgTt/dJTHUysMyqaDSWLCGQGbs7ZVyca2B8FfOpJaS5iqc6wePdBoq5M8mKCBgbgA5ddIcM73QRc+kPdGgSXvsZbOBJVkRQOc5haxtQ2ZW4UgPtro1R7xIL6zXky1nJiggIIShZBaxtLmNWfUHTbWE6M8KBZQS1EIojfNAiPvivYugmVDKB/UMdiURCVr58iAn+QiB4bTR+dZrHvgrQoxSfR8eMDpy8I5cAAAAASUVORK5CYII=') no-repeat center center; color: #0066cc; font-size: 11px; margin: 0 2px; }" +
				"#searchInput { width: 96px; height: 24px; position: relative; padding: 0; box-sizing: border-box; }" +
				".small-button { width: 20px; height: 20px; position: relative; padding: 2px; }" +
				".small-button-hover { background-color: #64C4F7; border-color: #0059DF;  }" +
				".small-button-active { background-color: #3399FF; border-color: #0059DF;  }" +
				".h-box-layout {display: inline-flex; position: relative; }"+
				".button-horizontal-layout { display: inline-block; position: relative; width: 128px; height: 24px; }" +
				".input-horizontal-layout { display: inline-block; position: relative; width: 96px; height: 24px; }"+
				'#pbMenuWrapper { align-content: center; padding: 0px 0px 0px 0px; }'+
				".pb-menu-wrapper { padding: 0px 0px 0px 0px; margin: 0px 0px 0px 0px; position: absolute; width: 192px; }"+
				'.pb-menu.pb-menu-item { border: 1px solid #DBF1FD;  background-color: #ddd; width: 192; height: 18px; list-style-type: none;  margin: 0px 0px 1px 0px; padding: 0px 0px 0px 0px; }'+
				'.pb-menu.pb-menu-item:hover { background-color: #64C4F7; border-color: #0059DF;  }' +
				'.pb-menu.pb-menu-item:active { background-color: #3399FF; border-color: #0059DF;  }'+
				'#pbMenu { background-color: #f5f5f5; display: block; padding: 0px 0px 0px 0px; margin: 0px 0px 0px 0px; }'+
				'.element-display-block { display: block; }'+
				'.element-display-none { display: none; }',
			html:
				'<div id="tbar" class="toolbar"><div>' +
				'<table><tr>' +
				'<td><div class="h-box-layout input-horizontal-layout">' +
					'<input id="searchInput" type="text" placeholder="Search" />' +
				'</div></td>' +
				'<td><div class="h-box-layout button-horizontal-layout">' +
					'<input id="searchButton" class="small-button search-button" title="Search" type="image" src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABdklEQVRIx+3VoU9bURQG8F8DrgG5pAKDWermhkJUFTI3QYJpUjk/sz8BgZ2bIRlDLDPDMrmJCWACVQSbKJlZIISxZXTma9K9vL4WQjLDl9zk5dzzfee8e849l3vcAdrYQg+/snqxraBWRa7abOIVHuM79nCcvUW08ACf0MXRTbJu4Qx9dDBb4jObvX58W9OKN0M4QCO2OpbwCDMF/wb2w2lOEq/hY7Iair/AOQZZJ3hSEqQfbm1SQQf59aH4NXawijV8xm8sF7idcFeqAmzhNOdbT+Y7BZ96uuhDSU1OozEWPWzneykZrZb4beCyxL4djX+ijmIBb/L9MwHmSoTmcFViP8bTqgCj+IJveI73uIj9IdaxO4Y3qArwNZcI/uAZ3uEQb5P5OubTlkUsJqmpijzEcgp6iR94jZfprs2bFrkdYmeKC7kZ3+5Im15HoxLFi1aFbo5l9KLdalRUoRHfqUbFnQ+7/zauxz04V4UHpz1puN1jIv4CviFqfyis9vMAAAAASUVORK5CYII=" />' +
					'<input id="sortButton" class="small-button sort-button" title="Sort" type="image" src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA2ElEQVRIx+2U0Q2CQAyGvxIcwCWM2+hCStzBbZiEDXhiAZX6UpLLBcrJnW/8SZMe0P9vS6+wYyMuQA+MZj1wXfhWgI+ZpApM5FOg2rMiAmFAZWd1CFyBOrEi3drreqWSV+DrPwQkJ/s1gdHeq/lFBXTmrCXvgUQTIc4IZk2R5GZaO9MjM206/Nqq2sm8Cogl50d7OAGDkT9L7iKAI9AZeTtTrQSVxqtFUlrXWns6E4txC4jHaDne1wSeFjAAZyerJiCfrEndphpl9U4QabbeA2+KHgv+jjR8AR+ySqzd1clZAAAAAElFTkSuQmCC" />' +
					'<input id="refreshButton" class="small-button refresh-button" title="Refresh Entries" type="image" src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABb0lEQVRIx93VPUtcQRQG4EcNsRNiI2ZBQWwi6SSkSREIWFuaysrKyj9g7Z8QLNbGKraCnY2EaBdIl7CJIkSRsBa6KGneYrneq3f9CMQDAzPnvHO+5wz/O/XVwDQwizd4Gd4BPmMTP+9qvIEmOrhCCztZrfA6wTR6VT6DE7SxgskSzGRk7WBnelF+jj1M1MBPBHtex0gj3uxhqEQ+h4US/lDunNyWrmZCrvJ8HpdYqoikHR2V3neS17J8r+IbLlLgjyW4legojWIxF4sFfYc/2McyfuMU0xWOXEXXNVpL+3XTc3zHBgbi4Sne3pDmVnRdo630eLGjLjGa8xRed8lflDzWnegCz27pqnEc4zDnrwX5l6StsrDdBg7woSTcYYzgqCAbwVhqUnRqu26RB2NkHf1d/P7wWsHUKnJVm77HGXbT/0vZn0VWu01vemivIvuR1Qyvp4dWZ1RUUe1R8ejD7p+M6wf9cO77ZX7CL0+a/gIqU3PxAoDTgQAAAABJRU5ErkJggg==" />' +
					'<input id="preferencesButton" class="small-button preferences-button" title="Preferences" type="image" src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABWElEQVRIx8WVsWoCQRCGv4PzBQQRq+CbxDSCV1j4Blpa5AXS5QFSnG8QSKpUYlIL9lqJz6FgvOYuzUSWZXZvTzZkYLjbvZn5Z2b/nYM/liTQ7gnIrL1P4DlWIlugEi3luYtZ6VECm3q6JdAdMAfaxt7YyN6soAQmhl0HeAT6PoClOJ+BV1mXHoAK+ALegIusV67gQ6UNt+rIDt4C9kqWVUAF2vtBYl5lWuNQALlQNQMWsudLaGYC9ICNo9wCuFda+iDfNJ810NXalCsZ5R5SLBT7FyB1ObSVbDIPQKbYmxRXkRLJJGkwboLsUymvSYtcLW3Zhl05GI0VBTBQgg8MJtks2ghxrjKruTg2TXMPg351ajPoEPGi7bU2jSICDF2HthKDC/Aug6xu7ixlMJ6NtVP6MnI7xt7EU8HYukNzGfmN5aQAHGP+0XZKa7YhjmkgwAfwrZzX/8sP7iL3QyTxDqcAAAAASUVORK5CYII=" />' +
				'</div></td></tr></table></div></div>' +
				"<div id='list'></div>"
		});
		
		var menuWrapper 	= panel.document.createElement("div");
		menuWrapper.id 		= "pbMenuWrapper";
		menuWrapper.className 	= "pb-menu pb-menu-wrapper element-display-none";
		menuWrapper.innerHTML 	= 
		'<ul id="pbMenu">'+
		    '<li id="menuitemfirst" class="pb-menu pb-menu-item">Menu Item 1</li>'+
		    '<li id="menuitemnewinstance" class="pb-menu pb-menu-item">Open new Dialog instance</li>'+
		'</ul>';

		panel.byId("tbar").appendChild(menuWrapper);
		panel.prototype.children = {};
		dock = panel.dock;
		listContainer = panel.byId("list");
		var searchInput = panel.byId("searchInput");
		var sortOrder = "Line number";
		var btns = panel.byClass("small-button");
		var bookmarkItems=panel.byClass("bookmark-item");
		var pbMenuItems = panel.byClass("pb-menu-item");
// BOOKMARK: actions;			
		var actions = [
			function(el) { searchInBookMarks(searchInput.value); },
			function(el) { sortBookmarks(sortOrder); },
			function(el) { refreshBookmarks(); },
			function(el) {
				var pbMenu = panel.byId("pbMenuWrapper");
				if (!pbMenu){
					var menuWrapper = panel.document.createElement("div");
					menuWrapper.id = "pbMenuWrapper";
					menuWrapper.className = "pb-menu pb-menu-wrapper element-display-block";
					menuWrapper.innerHTML = 
					'<ul id="pbMenu">'+
					    '<li id="menuitemfirst" class="pb-menu pb-menu-item" title="Menu Item 1">Menu Item 1</li>'+
					    '<li id="menuitemnewinstance" class="pb-menu pb-menu-item" title="Open new Dialog instance">Open new Dialog instance</li>'+
					'</ul>';
					
					panel.byId("tbar").appendChild(menuWrapper);
				} else {
					toggleHidden.call(el, pbMenu);
				}
			}
		];
		
		var menuitemactions = [
			function(el) {  },
			function(el) {  }
		];
		pbMenuItems.on("mouseover", function() {
			this.classList.add("small-button-hover");
		}).on("mousedown", function() {
			this.classList.add("small-button-active");
		}).on("mouseup", function() {
			this.classList.remove("small-button-active");
		}).on("mouseout", function() {
			this.classList.remove("small-button-active");
			this.classList.remove("small-button-active");
		}).on("click", function() {
			menuitemactions[this.index()](this);
		});
		bookmarkItems.on("mouseover", function() {
			this.classList.add("small-button-hover");
		}).on("mousedown", function() {
			this.classList.add("small-button-active");
		}).on("mouseup", function() {
			this.classList.remove("small-button-active");
		}).on("mouseout", function() {
			this.classList.remove("small-button-active");
			this.classList.remove("small-button-active");
		});
		btns.on("mouseover", function() {
			this.classList.add("small-button-hover");
		}).on("mousedown", function() {
			this.classList.add("small-button-active");
		}).on("mouseup", function() {
			this.classList.remove("small-button-active");
		}).on("mouseout", function() {
			this.classList.remove("small-button-active");
			this.classList.remove("small-button-hover");
		}).on("click", function() {
			actions[this.index()](this);
		});

		// Live filter as you type in the search box
		searchInput.onkeyup = function() {
			searchInBookMarks(this.value);
		};
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
		BUFFERACTIVATED: function () { if (dock && dock.visible) refreshBookmarks(true); },
		FILESAVED: function () { if (dock && dock.visible) refreshBookmarks(true); }
	});

})();
