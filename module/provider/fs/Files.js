Class.create("Files", Collection, {
	_isFile: false,
	_isDir: false,
	_isRecycle: false,

	setSelectedItems : function(items, source){
		if(!source){
			this._selectionSource = {};
		}else{
			this._selectionSource = source;
		}
		this._selectedItems = $A(items);
		this._isEmpty = !(items && items.length);
		this._isFile = this._isDir = this._isRecycle = false;
		if(!this._isEmpty)
		{
			this._isUnique = !!(items.length == 1);
			for(var i=0; i<items.length; i++)
			{
				var selectedItem = items[i];
				if(selectedItem.isLeaf()) this._isFile = true;
				else this._isDir = true;
				if(selectedItem.isRecycle()) this._isRecycle = true;
			}
		}
		document.fire("app:selection_changed", this);	
	},

	/**
	 * Whether the selection has a file selected.
	 * Should be hasLeaf
	 * @returns Boolean
	 */
	hasFile : function (){
		return this._isFile;
	},
	
	/**
	 * Whether the selection has a dir selected
	 * @returns Boolean
	 */
	hasDir : function (){
		return this._isDir;
	},
			
	/**
	 * Whether the current context is the recycle bin
	 * @returns Boolean
	 */
	isRecycle : function (){
		return this._isRecycle;
	},
	
	/**
	 * Whether the context item has a child with this basename
	 * @param newFileName String The name to check
	 * @returns Boolean
	 */
	fileNameExists: function(newFileName) 
	{	
		var allItems = this._contextItem.getChildren();
		if(!allItems.length)
		{		
			return false;
		}
		for(i=0;i<allItems.length;i++)
		{
			var meta = allItems[i].getMetadata();
			var crtFileName = getBaseName(meta.get('filename'));
			if(crtFileName && crtFileName.toLowerCase() == getBaseName(newFileName).toLowerCase()) 
				return true;
		}
		return false;
	}	
)}

