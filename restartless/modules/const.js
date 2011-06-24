const XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
					.getService(Ci.nsIXULAppInfo)
					.QueryInterface(Ci.nsIXULRuntime);

var exports = {
	domain         : 'extensions.foxsplitter@piro.sakura.ne.jp.',
	IMAGES_VERSION : 1,

	ATTACHED_POSITION : 'foxsplitter-attached-position',
	ACTIVE            : 'foxsplitter-active',
	MEMBER            : 'foxsplitter-member-window',
	HOVER             : 'foxsplitter-hover',
	STATE             : 'foxsplitter-state',
	ID                : 'foxsplitter-id',
	SYNC_SCROLL       : 'foxsplitter-syncScroll',
	COLLAPSED_ORIGINAL_WIDTH  : 'foxsplitter-collapsed-window-original-width',
	COLLAPSED_ORIGINAL_HEIGHT : 'foxsplitter-collapsed-window-original-height',

	DROP_INDICATOR : 'foxsplitter-drop-indicator',
	TOOLBAR_ITEM   : 'foxsplitter-toolbar-item',
	MENU_ITEM      : 'foxsplitter-menuitem',
	COLLAPSED_BAR  : 'foxsplitter-collapsed-window-toolbar',

	EVENT_TYPE_READY : 'nsDOMFoxSplitterReady',
	EVENT_TYPE_WINDOW_STATE_CHANGED : 'nsDOMFoxSplitterWindowStateChange',

	STATE_MAXIMIZED  : Ci.nsIDOMChromeWindow.STATE_MAXIMIZED,
	STATE_MINIMIZED  : Ci.nsIDOMChromeWindow.STATE_MINIMIZED,
	STATE_NORMAL     : Ci.nsIDOMChromeWindow.STATE_NORMAL,
	STATE_FULLSCREEN : Ci.nsIDOMChromeWindow.STATE_FULLSCREEN,

	// compatible to old implementation
	POSITION_TOP    : (1 << 2),
	POSITION_RIGHT  : (1 << 1),
	POSITION_BOTTOM : (1 << 3),
	POSITION_LEFT   : (1 << 0),

	POSITION_HORIZONTAL : (1 << 0) | (1 << 1),
	POSITION_VERTICAL   : (1 << 2) | (1 << 3),

	POSITION_VALID   : (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),
	POSITION_INVALID : 0,

	POSITION_OUTSIDE : (1 << 4),
	POSITION_INSIDE  : (1 << 5),


	// compatible to old implementation
	TILE_MODE_GRID   : 0,
	TILE_MODE_X_AXIS : (1 << 0),
	TILE_MODE_Y_AXIS : (1 << 1),


	IMPORT_NOTHING     : 0,
	IMPORT_ALL         : 1,
	IMPORT_ONLY_HIDDEN : 2,


	HIDE_MENUBAR   : (1 << 0),
	HIDE_TOOLBAR   : (1 << 1),
	HIDE_LOCATION  : (1 << 2),
	HIDE_BOOKMARKS : (1 << 3),
	HIDE_STATUS    : (1 << 4),
	HIDE_EXTRA     : (1 << 5),
	HIDE_NON_NAVIGATION_ITEMS : (1 << 6),

	RAISE_WINDOW_BY_FOCUS       : 0,
	RAISE_WINDOW_BY_RAISED_FLAG : 1,

	// opacity=0 panel isn't shown on Linux
	MIN_OPACITY : (XULAppInfo.OS == 'Linux' ? '0.01' : '0' ),
	// too small window isn't shown on Linux
	MIN_WIDTH : 16,
	MIN_HEIGHT : 16,

	COLLAPSED_WINDOW_SIZE : 24,


	STYLESHEET : <![CDATA[
		:root[chromehidden~="toolbar-non-navigation-items"] toolbar[customizable="true"] toolbarseparator,
		:root[chromehidden~="toolbar-non-navigation-items"] toolbar[customizable="true"] toolbarspring,
		:root[chromehidden~="toolbar-non-navigation-items"] #home-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #bookmarks-menu-button-container,
		:root[chromehidden~="toolbar-non-navigation-items"] #search-container,
		:root[chromehidden~="toolbar-non-navigation-items"] #print-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #downloads-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #history-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #bookarmks-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #new-window-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #cut-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #copy-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #paste-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #fullscreen-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #zoom-controls,
		:root[chromehidden~="toolbar-non-navigation-items"] #sync-button,
		:root[chromehidden~="toolbar-non-navigation-items"] #feed-button {
			visibility: collapse;
		}

		#%COLLAPSED_BAR% {
			background: ThreeDFace;
			height: 5000px;
			left: 0;
			position: fixed;
			top: 0;
			width: 5000px;
			-moz-binding: url('chrome://global/content/bindings/toolbar.xml#toolbar-drag');
		}

		.%DROP_INDICATOR% {
			background: rgba(0, 0, 0, 0.75);
			border: 0 solid rgba(255, 255, 255, 0.75);
			border-radius: 0;
			line-height: 0;
			margin: 0;
			opacity: %MIN_OPACITY%;
			padding: 0;
			-moz-appearance: none;
			-moz-border-radius: 0;
			-moz-box-align: center;
			-moz-box-pack: center;
			-moz-transition: opacity 0.25s ease-in;
		}

		.%DROP_INDICATOR%.top {
			border-top-width: 1px;
		}
		.%DROP_INDICATOR%.right {
			border-right-width: 1px;
		}
		.%DROP_INDICATOR%.bottom {
			border-bottom-width: 1px;
		}
		.%DROP_INDICATOR%.left {
			border-left-width: 1px;
		}

		.%DROP_INDICATOR% label {
			color: white;
			line-height: 0;
			margin: 0;
			min-height: 0;
			min-width: 0;
			padding: 0;
		}

		.toolbarbutton-1.%TOOLBAR_ITEM%,
		#foxsplitter-syncScroll-button {
			list-style-image: url("resource://foxsplitter-resources/modules/images/icon16.png?%IMAGES_VERSION%") !important;
			-moz-image-region: rect(0 16px 16px 0);
		}

		toolbox[iconsize="large"] .toolbarbutton-1.%TOOLBAR_ITEM%.platform-Linux {
			list-style-image: url("resource://foxsplitter-resources/modules/images/icon24.png?%IMAGES_VERSION%") !important;
			-moz-image-region: rect(0 24px 24px 0);
		}

		.%MENU_ITEM%.menuitem-iconic,
		.%MENU_ITEM%.menu-iconic,
		.%MENU_ITEM%[iconic="true"] {
			list-style-image: url("resource://foxsplitter-resources/modules/images/icon16.png?%IMAGES_VERSION%") !important;
			-moz-image-region: rect(0 16px 16px 0);
		}
		.%MENU_ITEM%.split                         { -moz-image-region: rect(0 16px 16px 0); }
		.%MENU_ITEM%.split[disabled="true"]        { -moz-image-region: rect(16px 16px 32px 0); }
		.%MENU_ITEM%.closeAll                      { -moz-image-region: rect(0 32px 16px 16px); }
		.%MENU_ITEM%.closeAll[disabled="true"]     { -moz-image-region: rect(16px 32px 32px 16px); }
		.%MENU_ITEM%.gather                        { -moz-image-region: rect(0 48px 16px 32px); }
		.%MENU_ITEM%.gather[disabled="true"]       { -moz-image-region: rect(16px 48px 32px 32px); }
		.%MENU_ITEM%.tile-grid                     { -moz-image-region: rect(0 64px 16px 48px); }
		.%MENU_ITEM%.tile-grid[disabled="true"]    { -moz-image-region: rect(16px 64px 32px 48px); }
		.%MENU_ITEM%.tile-x                        { -moz-image-region: rect(0 80px 16px 64px); }
		.%MENU_ITEM%.tile-x[disabled="true"]       { -moz-image-region: rect(16px 80px 32px 64px); }
		.%MENU_ITEM%.tile-y                        { -moz-image-region: rect(0 96px 16px 80px); }
		.%MENU_ITEM%.tile-y[disabled="true"]       { -moz-image-region: rect(16px 96px 32px 80px); }
		.%MENU_ITEM%.split-top                     { -moz-image-region: rect(0 144px 16px 128px); }
		.%MENU_ITEM%.split-top[disabled="true"]    { -moz-image-region: rect(16px 144px 32px 128px); }
		.%MENU_ITEM%.split-right                   { -moz-image-region: rect(0 160px 16px 144px); }
		.%MENU_ITEM%.split-right[disabled="true"]  { -moz-image-region: rect(16px 160px 32px 144px); }
		.%MENU_ITEM%.split-bottom                  { -moz-image-region: rect(0 176px 16px 160px); }
		.%MENU_ITEM%.split-bottom[disabled="true"] { -moz-image-region: rect(16px 176px 32px 160px); }
		.%MENU_ITEM%.split-left                    { -moz-image-region: rect(0 192px 16px 176px); }
		.%MENU_ITEM%.split-left[disabled="true"]   { -moz-image-region: rect(16px 192px 32px 176px); }

		:root:not([%MEMBER%="true"]) toolbox:not([customizing="true"]) #foxsplitter-syncScroll-button {
			visibility: collapse;
		}
		#foxsplitter-syncScroll-button                 { -moz-image-region: rect(0 112px 16px 96px); }
		#foxsplitter-syncScroll-button[checked="true"] { -moz-image-region: rect(0 128px 16px 112px); }
	]]>.toString()
};

exports.STYLESHEET = exports.STYLESHEET
							.replace(/\%[A-Z_]+\%/g, function(aMatched) {
								return exports[aMatched.substr(1, aMatched.length-2)];
							});

exports.positionName = {};
exports.positionName[exports.POSITION_TOP]     = 'top';
exports.positionName[exports.POSITION_RIGHT]   = 'right';
exports.positionName[exports.POSITION_BOTTOM]  = 'bottom';
exports.positionName[exports.POSITION_LEFT]    = 'left';
exports.positionName[exports.POSITION_INSIDE]  = 'in';
exports.positionName[exports.POSITION_OUTSIDE] = 'out';

exports.opposite = {};
exports.opposite[exports.POSITION_TOP]     = exports.POSITION_BOTTOM;
exports.opposite[exports.POSITION_RIGHT]   = exports.POSITION_LEFT;
exports.opposite[exports.POSITION_BOTTOM]  = exports.POSITION_TOP;
exports.opposite[exports.POSITION_LEFT]    = exports.POSITION_RIGHT;
exports.opposite[exports.POSITION_INSIDE]  = exports.POSITION_OUTSIDE;
exports.opposite[exports.POSITION_OUTSIDE] = exports.POSITION_INSIDE;

