/**
 * Collection for abstract Items. Serves as data and selection model as well.
 */
Class.create("Collection", {

	_currentRep: undefined, 
	_isEmpty: undefined,
	_isUnique: false,
	_pendingContextPath: null, 
	_pendingSelection: null,
	_selectionSource : {}, // fake object
	
	_root : null,

	/**
	 * Constructor
	 */
	initialize : function(){
		this._currentRep = '/';
		this._selectedItems = $A([]);
		this._isEmpty = true;
	},
	
	/**
	 * Sets the data source that will feed the items with children.
	 * @param iItemProvider IItemProvider 
	 */
	setItemProvider : function(iItemProvider){
		this._iItemProvider = iItemProvider;
	},
	
	/**
	 * Changes the current context item.
	 * @param item Item Target item, either an existing one or a fake one containing the target part.
	 * @param forceReload Boolean If set to true, the item will be reloaded even if already loaded.
	 */
	requireContextChange : function(item, forceReload){
		var path = item.getPath();
		if((path == "" || path == "/") && item != this._root){
			item = this._root;
		}
		if(item.getMetadata().get('paginationData') && item.getMetadata().get('paginationData').get('new_page') 
			&& item.getMetadata().get('paginationData').get('new_page') != item.getMetadata().get('paginationData').get('current')){
				var paginationPage = item.getMetadata().get('paginationData').get('new_page');
				forceReload = true;			
		}
		if(item != this._root && (!item.getParent() || item.fake)){
			// Find in arbo or build fake arbo
			var fakeItems = [];
			item = item.findInArbo(this._root, fakeItems);
			if(fakeItems.length){
				var firstFake = fakeItems.shift();
				firstFake.observeOnce("first_load", function(e){					
					this.requireContextChange(item);
				}.bind(this));
				firstFake.observeOnce("error", function(message){
					app.displayMessage("ERROR", message);
					firstFake.notify("item_removed");
					var parent = firstFake.getParent();
					parent.removeChild(firstFake);
					delete(firstFake);
					this.requireContextChange(parent);
				}.bind(this) );
				document.fire("app:context_loading");
				firstFake.load(this._iItemProvider);
				return;
			}
		}		
		item.observeOnce("loaded", function(){
			this.setContextItem(item, true);			
			document.fire("app:context_loaded");
		}.bind(this));
		item.observeOnce("error", function(message){
			app.displayMessage("ERROR", message);
			document.fire("app:context_loaded");
		}.bind(this));
		document.fire("app:context_loading");
		try{
			if(forceReload){
				if(paginationPage){
					item.getMetadata().get('paginationData').set('current', paginationPage);
				}
				item.reload(this._iItemProvider);
			}else{
				item.load(this._iItemProvider);
			}
		}catch(e){
			document.fire("app:context_loaded");
		}
	},
	
	/**
	 * Sets the root of the data store
	 * @param root Item The parent item
	 */
	setRootItem : function(root){
		this._root = root;
		this._root.setRoot();
		this._root.observe("child_added", function(c){
				//console.log(c);
		});
		document.fire("app:root_item_changed", this._root);
		this.setContextItem(this._root);
	},
	
	/**
	 * Gets the current root item
	 * @returns Item
	 */
	getRootItem : function(root){
		return this._root;
	},
	
	/**
	 * Sets the current context item
	 * @param item Item
	 * @param forceEvent Boolean If set to true, event will be triggered even if the current item is already the same.
	 */
	setContextItem : function(item, forceEvent){
		if(this._contextItem && this._contextItem == item && this._currentRep  == item.getPath() && !forceEvent){
			return; // No changes
		}
		this._contextItem = item;
		this._currentRep = item.getPath();
		document.fire("app:context_changed", item);
	},
	
	/**
	 * Get the current context item
	 * @returns Item
	 */
	getContextItem : function(){
		return this._contextItem;
	},
	
	/**
	 * After a copy or move operation, many items may have to be reloaded
	 * This function tries to reload them in the right order and if necessary.
	 * @param items Items[] An array of items
	 */
	multipleItemsReload : function(items){
		items = $A(items);
		for(var i=0;i<items.length;i++){
			var itemPathOrItem = items[i];
			var item;
			if(Object.isString(itemPathOrItem)){
				item = new Item(itemPathOrItem);	
				if(item.getPath() == this._root.getPath()) item = this._root;
				else item = item.findInArbo(this._root, []);
			}else{
				item = itemPathOrItem;
			}
			items[i] = item;		
		}
		var children = $A([]);
		items.sort(function(a,b){
			if(a.isParentOf(b)){
				children.push(b);
				return -1;
			}
			if(a.isChildOf(b)){
				children.push(a);
				return +1;
			}
			return 0;
		});
		children.each(function(c){
			items = items.without(c);
		});
		items.each(this.queueItemReload.bind(this));
		this.nextItemReloader();
	},
	
	/**
	 * Add a item to the queue of items to reload.
	 * @param item Item
	 */
	queueItemReload : function(item){
		if(!this.queue) this.queue = [];
		if(item){
			this.queue.push(item);
		}
	},
	
	/**
	 * Queue processor for the items to reload
	 */
	nextItemReloader : function(){
		if(!this.queue.length) {
			window.setTimeout(function(){
				document.fire("app:context_changed", this._contextItem);
			}.bind(this), 200);
			return;
		}
		var next = this.queue.shift();
		var observer = this.nextItemReloader.bind(this);
		next.observeOnce("loaded", observer);
		next.observeOnce("error", observer);
		if(next == this._contextItem || next.isParentOf(this._contextItem)){
			this.requireContextChange(next, true);
		}else{
			next.reload(this._iItemProvider);
		}
	},
	
	/**
	 * Sets an array of items to be selected after the context is (re)loaded
	 * @param selection Item[]
	 */
	setPendingSelection : function(selection){
		this._pendingSelection = selection;
	},
	
	/**
	 * Gets the array of items to be selected after the context is (re)loaded
	 * @returns Item[]
	 */
	getPendingSelection : function(){
		return this._pendingSelection;
	},
	
	/**
	 * Clears the items to be selected
	 */
	clearPendingSelection : function(){
		this._pendingSelection = null;
	},
	
	/**
	 * Set an array of items as the current selection
	 * @param items Item[] The items to select
	 * @param source String The source of this selection action
	 */
	setSelectedItems : function(items, source){
		if(!source){
			this._selectionSource = {};
		}else{
			this._selectionSource = source;
		}
		this._selectedItems = $A(items);
		this._isEmpty = !(items && items.length);
		if(!this._isEmpty)
		{
			this._isUnique = !!(items.length == 1);
		}
		document.fire("app:selection_changed", this);	
	},
	
	/**
	 * Gets the currently selected items
	 * @returns Item[]
	 */
	getSelectedItems : function(){
		return this._selectedItems;
	},
	
	/**
	 * Gets the source of the last selection action
	 * @returns String
	 */
	getSelectionSource : function(){
		return this._selectionSource;
	},
	
	/**
	 * Select all the children of the current context item
	 */
	selectAll : function(){
		this.setSelectedItems(this._contextItem.getChildren(), "collection");
	},
	
	/**
	 * Whether the selection is empty
	 * @returns Boolean
	 */
	isEmpty : function (){
		return (this._selectedItems ? (this._selectedItems.length==0) : true);
	},
	
	/**
	 * Whether the selection is unique
	 * @returns Boolean
	 */
	isUnique : function (){
		return this._isUnique;
	},
	
	/**
	 * Whether the selection has more than one item selected
	 * @returns Boolean
	 */
	isMultiple : function(){
		if(this._selectedItems && this._selectedItems.length > 1) return true;
		return false;
	},
	
	/**
	 * Whether the selection has an item with one of the mimes
	 * @param mimeTypes Array Array of mime types
	 * @returns Boolean
	 */
	hasMime : function(mimeTypes){
		if(mimeTypes.length==1 && mimeTypes[0] == "*") return true;
		var has = false;
		mimeTypes.each(function(mime){
			if(has) return;
			has = this._selectedItems.any(function(item){
				return (getMimeType(item) == mime);
			});
		}.bind(this) );
		return has;
	},
	
	/**
	 * Get all selected items as an array.
	 * @param separator String Is a separator, will return a string joined
	 * @returns Array|String
	 */
	getItemNames : function(separator){
		if(!this._selectedItems.length)
		{
			alert('Please select an item!');
			return false;
		}
		var tmp = new Array(this._selectedItems.length);
		for(i=0;i<this._selectedItems.length;i++)
		{
			tmp[i] = this._selectedItems[i].getPath();
		}
		if(separator){
			return tmp.join(separator);
		}else{
			return tmp;
		}
	},
	
	/**
	 * Get all the items of the current context item children
	 * @param separator String If passed, will join the array as a string
	 * @return Array|String
	 */
	getContextItemNames : function(separator){
		var allItems = this._contextItem.getChildren();
		if(!allItems.length)
		{		
			return false;
		}
		var names = $A([]);
		for(i=0;i<allItems.length;i++)
		{
			names.push(getBaseName(allItems[i].getPath()));
		}
		if(separator){
			return names.join(separator);
		}else{
			return names;
		}
	},
	
	/**
	 * Gets the first name of the current selection
	 * @returns String
	 */
	getUniqueItemName : function(){	
		if(this.getItemNames().length) return this.getItemNames()[0];
		return null;	
	},
	
	/**
	 * Gets the first item of the selection, or Null
	 * @returns Item
	 */
	getUniqueItem : function(){
		if(this._selectedItems.length){
			return this._selectedItems[0];
		}
		return null;
	},
	
    /**
     * Gets a item from the current selection
     * @param i Integer the item index
     * @returns Item
     */
    getItem : function(i) {
        return this._selectedItems[i];
    },
	
    /**
		 * TODO use item or move to fs/Files.js
     * Will add the current selection items as serializable data to the element passed : 
     * either as hidden input elements if it's a form, or as query parameters if it's an url
     * @param oFormElement HTMLForm The form
     * @param sUrl String An url to complete
     * @returns String
     */
	updateFormOrUrl : function (oFormElement, sUrl){
		// CLEAR FROM PREVIOUS ACTIONS!
		if(oFormElement)	
		{
			$(oFormElement).getElementsBySelector("input").each(function(element){
				if(element.name.indexOf("file_") != -1 || element.name=="file") element.value = "";
			});
		}
		// UPDATE THE 'DIR' FIELDS
		if(oFormElement && oFormElement.rep) oFormElement.rep.value = this._currentRep;
		sUrl += '&dir='+encodeURIComponent(this._currentRep);
		
		// UPDATE THE 'file' FIELDS
		if(this.isEmpty()) return sUrl;
		var fileNames = this.getItemNames();
		if(this.isUnique())
		{
			sUrl += '&'+'file='+encodeURIComponent(fileNames[0]);
			if(oFormElement) this._addHiddenField(oFormElement, 'file', fileNames[0]);
		}
		else
		{
			for(var i=0;i<fileNames.length;i++)
			{
				sUrl += '&'+'file_'+i+'='+encodeURIComponent(fileNames[i]);
				if(oFormElement) this._addHiddenField(oFormElement, 'file_'+i, fileNames[i]);
			}
		}
		return sUrl;
	},
	
	_addHiddenField : function(oFormElement, sFieldName, sFieldValue){
		if(oFormElement[sFieldName]) oFormElement[sFieldName].value = sFieldValue;
		else{
			var field = document.createElement('input');
			field.type = 'hidden';
			field.name = sFieldName;
			field.value = sFieldValue;
			oFormElement.appendChild(field);
		}
	}
});
