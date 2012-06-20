/**
 * Abstract container for data
 */
Class.create("Item", {
	/**
	 * Constructor
	 * @param path String
	 * @param isLeaf Boolean
	 * @param label String
	 * @param icon String
	 * @param iItemProvider IItemProvider
	 */
	initialize : function(path, isLeaf, label, icon, iItemProvider){
		this._path = path;
		if(this._path && this._path.length && this._path.length > 1){
			if(this._path[this._path.length-1] == "/"){
				this._path = this._path.substring(0, this._path.length-1);
			}
		}
		this._metadata = $H();
		this._isLeaf = isLeaf || false;
		this._label = label || '';
		this._icon = icon || '';
		this._children = $A([]);
		this._isRoot = false;
		
		this._isLoaded = false;
		this.fake = false;
		this._iItemProvider = iItemProvider;
		
	},
	/**
	 * The item is loaded or not
	 * @returns Boolean
	 */
	isLoaded : function(){
		return this._isLoaded;
	},
	/**
	 * Changes loaded status
	 * @param bool Boolean
	 */
	setLoaded : function(bool){
		this._isLoaded = bool;
	},
	/**
	 * Loads the item using its own provider or the one passed
	 * @param iItemProvider IItemProvider Optionnal
	 */
	load : function(iItemProvider){		
		if(this.isLoading) return;		
		if(!iItemProvider){
			if(this._iItemProvider){
				iItemProvider = this._iItemProvider;
			}else{
				iItemProvider = new RemoteItemProvider();
			}
		}
		this.isLoading = true;
		this.notify("loading");
		if(this._isLoaded){
			this.isLoading = false;
			this.notify("loaded");
			return;
		}
		iItemProvider.loadItem(this, function(item){
			this._isLoaded = true;
			this.isLoading = false;
			this.notify("loaded");
			this.notify("first_load");
		}.bind(this));		
	},
	/**
	 * Remove children and reload item
	 * @param iItemProvider IItemProvider Optionnal
	 */
	reload : function(iItemProvider){
		this._children.each(function(child){
			this.removeChild(child);
		}.bind(this));
		this._isLoaded = false;		
		this.load(iItemProvider);
	},
	/**
	 * Unload child and notify "force_clear"
	 */
	clear : function(){
		this._children.each(function(child){
			this.removeChild(child);
		}.bind(this));
		this._isLoaded = false;		
		this.notify("force_clear");
	},
	/**
	 * Sets this Item as being the root parent
	 */
	setRoot : function(){
		this._isRoot = true;
	},
	/**
	 * Set the item children as a bunch
	 * @param Items Items[]
	 */
	setChildren : function(Items){
		this._children = $A(Items);
		this._children.invoke('setParent', this);
	},
	/**
	 * Get all children as a bunch
	 * @returns Item[]
	 */
	getChildren : function(){
		return this._children;
	},
	/**
	 * Adds a child to children
	 * @param Item Item The child
	 */
	addChild : function(Item){
		Item.setParent(this);
		if(this._iItemProvider) Item._iItemProvider = this._iItemProvider;
		if(existingItem = this.findChildByPath(Item.getPath())){
			existingItem.replaceBy(Item);
		}else{			
			this._children.push(Item);
			this.notify("child_added", Item.getPath());
		}
	},
	/**
	 * Removes the child from the children
	 * @param Item Item
	 */
	removeChild : function(Item){
		var removePath = Item.getPath();
		Item.notify("item_removed");
		this._children = this._children.without(Item);
		this.notify("child_removed", removePath);
	},
	/**
	 * Replaces the current item by a new one. Copy all properties deeply
	 * @param Item Item
	 */
	replaceBy : function(Item){
		this._isLeaf = Item._isLeaf;
		if(Item._label){
			this._label = Item._label;
		}
		if(Item._icon){
			this._icon = Item._icon;
		}
		if(Item._iItemProvider){
			this._iItemProvider = Item._iItemProvider;
		}
		this._isRoot = Item._isRoot;
		this._isLoaded = Item._isLoaded;
		this.fake = Item.fake;
		Item.getChildren().each(function(child){
			this.addChild(child);
		}.bind(this) );		
		var meta = Item.getMetadata();		
		meta.each(function(pair){
			if(this._metadata.get(pair.key) && pair.value === ""){
				return;
			}
			this._metadata.set(pair.key, pair.value);
		}.bind(this) );
		this.notify("item_replaced", this);		
	},
	/**
	 * Finds a child item by its path
	 * @param path String
	 * @returns Item
	 */
	findChildByPath : function(path){
		return $A(this._children).find(function(child){
			return (child.getPath() == path);
		});
	},
	/**
	 * Sets the metadata as a bunch
	 * @param data $H() A prototype Hash
	 */
	setMetadata : function(data){
		this._metadata = data;
	},
	/**
	 * Gets the metadat
	 * @returns $H()
	 */
	getMetadata : function(data){
		return this._metadata;
	},
	/**
	 * Is this item a leaf
	 * @returns Boolean
	 */
	isLeaf : function(){
		return this._isLeaf;
	},
	/**
	 * if name starts with dot
	 * @returns Boolean
	 */
	isHidden : function(){
		return /^\./.test(this._metadata.get("text"))
	},
	/**
	 * @returns String
	 */
	getPath : function(){
		return this._path;
	},
	/**
	 * @returns String
	 */
	getLabel : function(){
		return this._label;
	},
	/**
	 * @returns String
	 */
	getIcon : function(){
		return this._icon;
	},
	/**
	 * @returns Boolean
	 */
	isRecycle : function(){
		return (this.getMime() == 'recycle');
	},
	/**
	 * Search the mime type in the parent branch
	 * @param Mime String
	 * @returns Boolean
	 */
	hasMimeInBranch : function(mime){
		if(this.getMime() == mime.toLowerCase()) return true;
		var parent, crt = this;
		while(parent =crt._parentItem){
			if(parent.getMime() == mime.toLowerCase()){return true;}
			crt = parent;
		}
		return false;
	},	
	/**
	 * Sets a reference to the parent item
	 * @param parentItem Item
	 */
	setParent : function(parentItem){
		this._parentItem = parentItem;
	},
	/**
	 * Gets the parent Item
	 * @returns Item
	 */
	getParent : function(){
		return this._parentItem;
	},
	/**
	 * TODO Rename
	 * Finds this item by path if it already exists in arborescence 
	 * @param rootItem Item
	 * @param fakeItems Item[]
	 */
	findInArbo : function(rootItem, fakeItems){
		if(!this.getPath()) return;
		var pathParts = this.getPath().split("/");
		var parentItems = $A();
		var crtPath = "";
		var crtItem, crtParentItem = rootItem;
		for(var i=0;i<pathParts.length;i++){
			if(pathParts[i] == "") continue;
			crtPath = crtPath + "/" + pathParts[i];
			if(item = crtParentItem.findChildByPath(crtPath)){
				crtItem = item;
			}else{
				crtItem = new Item(crtPath, false, getBaseName(crtPath));
				crtItem.fake = true;				
				fakeItems.push(crtItem);
				crtParentItem.addChild(crtItem);
			}
			crtParentItem = crtItem;
		}
		return crtItem;
	},
	/**
	 * @returns Boolean
	 */
	isRoot : function(){
		return this._isRoot;
	},
	/**
	 * Check if it's the parent of the given item
	 * @param item Item
	 * @returns Boolean
	 */
	isParentOf : function(item){
		var childPath = item.getPath();
		var parentPath = this.getPath();
		return (childPath.substring(0,parentPath.length) == parentPath);
	},
	/**
	 * Check if it's a child of the given item
	 * @param item Item
	 * @returns Boolean
	 */
	isChildOf : function(item){
		var childPath = this.getPath();
		var parentPath = item.getPath();
		return (childPath.substring(0,parentPath.length) == parentPath);
	},	
	/**
	 * Gets the current's item mime type, either by mime or by extension.
	 * @returns String
	 */
	getMime : function(){
		if(this._metadata && this._metadata.get("mime")) return this._metadata.get("mime").toLowerCase();
		if(this._metadata && this.isLeaf()) return getMimeType(this._metadata).toLowerCase();
		return "";
	}
});