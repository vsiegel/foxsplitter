/**
 * @fileOverview Toolbar item module for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2011 SHIMODA "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

const EXPORTED_SYMBOLS = ['ToolbarItem'];

const XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
					.getService(Ci.nsIXULAppInfo)
					.QueryInterface(Ci.nsIXULRuntime);

/**
 * aDefinition = nsIDOMElement (the toolbar item) ||
 *               {
 *                 node      : nsIDOMElement (the toolbar item),
 *                 toolbar   : String (optional: the ID of customizable toolbar),
 *                 onInit    : Function (optional: called when the item is inserted to the toolbar),
 *                 onDestroy : Function (optional: called when the item is removed from the toolbar)
 *               }
 */
function ToolbarItem(aDefinition) {
	this.init(aDefinition);
}
ToolbarItem.prototype = {
	get id()
	{
		return this.node.id;
	},
	get inserted()
	{
		const nsIDOMNode = Ci.nsIDOM3Node || Ci.nsIDOMNode; // on Firefox 7, nsIDOM3Node was merged to nsIDOMNode.
		return this._document.compareDocumentPosition(this.node) & nsIDOMNode.DOCUMENT_POSITION_CONTAINED_BY;
	},
	get defaultToolbar()
	{
		return this._definition.toolbar ? this._document.getElementById(this._definition.toolbar) : null ;
	},
	get defaultCustomizableToolbar()
	{
		return this._getNodeByXPath('/descendant::*[local-name()="toolbar" and @customizable="true"][1]');
	},
	get palette()
	{
		var toolbar = this.defaultToolbar || this.defaultCustomizableToolbar;
		return (
			(toolbar.toolbox && toolbar.toolbox.palette) ||
			this._getNodeByXPath('ancestor::*[local-name()="toolbox"]/descendant::*[local-name()="toolbarpalette"]', toolbar)
		);
	},

	init : function(aDefinition)
	{
		if (this._definition)
			return;

		aDefinition = this._normalizeDefinition(aDefinition);
		this._assertDefinition(aDefinition);
		this._definition = aDefinition;

		this.node = this._definition.node;
		this._document = this.node.ownerDocument || this.node;
		this._window = this._document.defaultView;

		this._window.addEventListener('beforecustomization', this, false);
		this._window.addEventListener('aftercustomization', this, false);
		this._window.addEventListener('unload', this, false);

		ToolbarItem.instances.push(this);

		this._initialInsert();

		this._onAfterCustomization();
	},

	destroy : function()
	{
		if (!this._definition)
			return;

		this._onBeforeCustomization();
		this._removeFromDefaultSet();

		this._window.removeEventListener('beforecustomization', this, false);
		this._window.removeEventListener('aftercustomization', this, false);
		this._window.removeEventListener('unload', this, false);

		if (this.node.parentNode)
			this.node.parentNode.removeChild(this.node);

		delete this._definition;
		delete this.node;
		delete this._document;
		delete this._window;

		ToolbarItem.instances = ToolbarItem.instances.filter(function(aItem) {
			return aItem != this;
		}, this);
	},

	_normalizeDefinition : function(aDefinition)
	{
		if (aDefinition instanceof Ci.nsIDOMElement)
			aDefinition = { node : aDefinition };
		if (aDefinition.element && !aDefinition.node)
			aDefinition.node = aDefinition.element;

		aDefinition.node.setAttribute('removable', true);
		aDefinition.node.setAttribute('class', aDefinition.node.className+' platform-'+XULAppInfo.OS);

		if (aDefinition.oninit && !aDefinition.onInit)
			aDefinition.onInit = aDefinition.oninit;
		if (aDefinition.init && !aDefinition.onInit)
			aDefinition.onInit = aDefinition.init;

		if (aDefinition.ondestroy && !aDefinition.onDestroy)
			aDefinition.onDestroy = aDefinition.ondestroy;
		if (aDefinition.destroy && !aDefinition.onInit)
			aDefinition.onDestroy = aDefinition.destroy;

		if (aDefinition.toolbar && aDefinition.toolbar instanceof Ci.nsIDOMElement)
			aDefinition.toolbar = aDefinition.toolbar.id;

		return aDefinition;
	},

	_assertDefinition : function(aDefinition)
	{
		if (!aDefinition.node)
			throw new Error('"node", the toolbar item DOM element is required!');
		if (!aDefinition.node.id)
			throw new Error('"node", the toolbar item DOM element must have ID!');
	},


	_initialInsert : function()
	{
		this._appendToDefaultSet();
		if (this._checkInsertedInOtherPlace())
			return;

		var toolbar = this.defaultToolbar;
		if (toolbar && !toolbar.toolbox)
			return;

		const Prefs = Cc['@mozilla.org/preferences;1']
						.getService(Ci.nsIPrefBranch);
		const key = 'extensions.restartless@piro.sakura.ne.jp.toolbaritem.'+this.id+'.initialized';

		var done = false;
		try {
			done = Prefs.getBoolPref(key);
		}
		catch(e) {
		}

		if (done || !toolbar) {
			let palette = this.palette;
			if (palette)
				palette.appendChild(this.node);
		}
		else {
			this._insertToDefaultToolbar();
		}

		if (!done)
			Prefs.setBoolPref(key, true);
	},

	_appendToDefaultSet : function()
	{
		var toolbar = this.defaultToolbar;
		if (!toolbar)
			return;

		var items = (toolbar.getAttribute('defaultset') || '').split(',');
		if (items.indexOf(this.id) > -1)
			return;

		var lastItem = this._getLastItemInToolbar(toolbar);
		if (lastItem) {
			let index = items.indexOf(lastItem.id);
			if (index > -1) {
				items.splice(index, 0, this.id);
			}
			else {
				items.push(this.id);
			}
		}
		else {
			items.push(this.id);
		}
		toolbar.setAttribute('defaultset', items.join(','));
	},

	_removeFromDefaultSet : function()
	{
		var toolbar = this.defaultToolbar;

		var items = (toolbar.getAttribute('defaultset') || '').split(',');
		var index = items.indexOf(this.id);
		if (index < 0)
			return;

		items.splice(index, 1);
		toolbar.setAttribute('defaultset', items.join(','));
	},

	_checkInsertedInOtherPlace : function()
	{
		var toolbar = this._getNodeByXPath('/descendant::*[local-name()="toolbar" and contains(concat(",",@currentset,","), '+this.id.quote()+')]');
		if (!toolbar)
			return false;

		if (!this.inserted) {
			let items = (toolbar.getAttribute('currentset') || '').split(',');
			let index = items.indexOf(this.id) + 1;
			if (index < items.length)
				toolbar.insertBefore(this.node, this._document.getElementById(items[index]));
		}
		return true;
	},

	_insertToDefaultToolbar : function()
	{
		var toolbar = this.defaultToolbar;
		if (!toolbar)
			return;

		toolbar.insertBefore(this.node, this._getLastItemInToolbar(toolbar));

		var currentset = toolbar.currentSet.replace(/__empty/, '');
		currentset = currentset ? currentset.split(',') : [] ;
		currentset.push(this.id);
		currentset = currentset.join(',');
		toolbar.currentSet = currentset;
		toolbar.setAttribute('currentset', currentset);
		this._document.persist(toolbar.id, 'currentset');
	},

	_getLastItemInToolbar : function(aToolbar)
	{
		return this._getNodeByXPath('descendant::*[@id="fullscreenflex" or @id="window-controls"][1]', aToolbar);
	},

	_getNodeByXPath : function(aExpression, aContext)
	{
		return this._document.evaluate(
			aExpression,
			aContext || this._document,
			null,
			Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
	},


	handleEvent : function(aEvent)
	{
		switch (aEvent.type)
		{
			case 'beforecustomization':
				return this._onBeforeCustomization();

			case 'aftercustomization':
				return this._onAfterCustomization();

			case 'unload':
				return this.destroy();
		}
	},

	_onBeforeCustomization : function()
	{
		if (this._definition && this._definition.destroy && this.inserted)
			this._definition.destroy();
	},

	_onAfterCustomization : function()
	{
		if (this._definition && this._definition.destroy && this.inserted)
			this._definition.init();
	},


	addEventListener : function(aType, aListener, aUseCapture, aAcceptUnsafeEvents)
	{
		return this.node.addEventListener(aType, aListener, aUseCapture, aAcceptUnsafeEvents);
	},

	removeEventListener : function(aType, aListener, aUseCapture, aAcceptUnsafeEvents)
	{
		return this.node.removeEventListener(aType, aListener, aUseCapture, aAcceptUnsafeEvents);
	}
};

ToolbarItem.instances = [];
ToolbarItem.BASIC_ITEM_CLASS = 'toolbarbutton-1 chromeclass-toolbar-additional';

/** A handler for bootstrap.js */
function shutdown()
{
	ToolbarItem.instances.slice(0).forEach(function(aItem) {
		aItem.destroy();
	});
	ToolbarItem = undefined;
}
