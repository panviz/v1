/**
@todo : I18N THIS STRING
 */
webFXTreeConfig.loadingText = "Loading...";

function splitOverlayIcons(item){
    if(!item.getMetadata().get("overlay_icon")  || !Modernizr.multiplebgs) return false;
    var ret = [];
    $A(item.getMetadata().get("overlay_icon").split(",")).each(function(el){
        ret.push(resolveImageSource(el, "/image/overlays/ICON_SIZE", 8));
    });
    return ret;
}

function Tree(rootNode, sAction, filter) {
	this.WebFXTree = WebFXTree;
	this.loaded = true;
	this.item = rootNode;
	var icon = rootNode.getIcon();
	if(icon.indexOf(THEME.path+"/") != 0){
		icon = resolveImageSource(icon, "/image/mimes/ICON_SIZE", 16);
	}
	var openIcon = rootNode.getMetadata().get("openicon");
	if(openIcon){
		if(openIcon.indexOf(THEME.path+"/") != 0){
			openIcon = resolveImageSource(openIcon, "/image/mimes/ICON_SIZE", 16);
		}
	}else{
		openIcon = icon;
	}
	
	this.WebFXTree(rootNode.getLabel(), sAction, 'explorer', icon, openIcon);
	// setup default property values
	this.loading = false;
	this.loaded = false;
	this.errorText = "";
	if(filter){
		this.filter = filter;
 	}
    this.overlayIcon = splitOverlayIcons(rootNode);

	this._loadingItem = new WebFXTreeItem(webFXTreeConfig.loadingText);		
	if(this.open) this.item.load();
	else{
		this.add(this._loadingItem);
	}
};

Tree.prototype = new WebFXTree;

Tree.prototype._webfxtree_expand = WebFXTree.prototype.expand;
Tree.prototype.expand = function() {
	if(!this.item.fake){
		this.item.load();
	}
	this._webfxtree_expand();
};

Tree.prototype.destroy = function(){
    if(this.item) this.item.stopObserving();
};

Tree.prototype.setAjxpRootNode = function(rootNode){
	if(this.item){
		var oldNode = this.item;
	}
	this.item = rootNode;	
	var clear = function(){
		this.open = false;
		while (this.childNodes.length > 0)
			this.childNodes[this.childNodes.length - 1].remove();
		this.loaded = false;
	};
	this.item.observe("force_clear",  clear.bind(this));
	this.item.observe("node_replaced",  clear.bind(this));
	this.attachListeners(this, rootNode);
	if(oldNode){
		oldNode.notify("node_replaced");
	}
	//this.item.load();
};

Tree.prototype.attachListeners = function(jsNode, item){
	item.observe("child_added", function(childPath){
		if(item.getMetadata().get('paginationData')){
			var pData = item.getMetadata().get('paginationData');
			if(!this.paginated){
				this.paginated = true;
				if(pData.get('dirsCount')!="0"){
					this.updateLabel(this.text + " (" + I18N[pData.get('overflowMessage')]+ ")");
				}
			}
			return;
		}else if(this.paginated){
			this.paginated = false;
			this.updateLabel(this.text);
		}
		var child = item.findChildByPath(childPath);
		if(child){
			var jsChild = _itemToTree(child, this);
			if(jsChild){
				this.attachListeners(jsChild, child);
			}
		}
	}.bind(jsNode));
	item.observe("node_replaced", function(newNode){
		// Should refresh label / icon
		if(jsNode.updateIcon){ 
			var ic = resolveImageSource(item.getIcon(), "/image/mimes/ICON_SIZE", 16);
			var oic = ic;
			if(item.getMetadata().get("openicon")){
				oic = resolveImageSource(item.getMetadata().get("openicon"), "/image/mimes/ICON_SIZE", 16);
			}
			jsNode.updateIcon(ic, oic);
            jsNode.overlayIcon = splitOverlayIcons(item);
		}
		if(jsNode.updateLabel) jsNode.updateLabel(item.getLabel());
	}.bind(jsNode));
	item.observeOnce("node_removed", function(e){
		jsNode.remove();
	});
	item.observe("loading", function(){		
		//this.add(this._loadingItem);
	}.bind(jsNode) );
	item.observe("loaded", function(){
		this._loadingItem.remove();
		if(this.childNodes.length){
			this._webfxtree_expand();
		}
	}.bind(jsNode) );
};

function TreeItem(item, sAction, eParent) {
	this.WebFXTreeItem = WebFXTreeItem;
	this.item = item;
	var icon = item.getIcon();
	if(icon.indexOf(THEME.path+"/") != 0){
		icon = resolveImageSource(icon, "/image/mimes/ICON_SIZE", 16);
	}
	var openIcon = item.getMetadata().get("openicon");
	if(openIcon){
		if(openIcon.indexOf(THEME.path+"/") != 0){
			openIcon = resolveImageSource(openIcon, "/image/mimes/ICON_SIZE", 16);
		}
	}else{
		openIcon = icon;
	}
	
	this.folder = true;
	this.WebFXTreeItem(
        item.getLabel(),
        sAction,
        eParent,
        icon,
        (openIcon?openIcon:resolveImageSource("folder_open.png", "/image/mimes/ICON_SIZE", 16)),
        splitOverlayIcons(item)
    );

	this.loading = false;
	this.loaded = false;
	this.errorText = "";

	this._loadingItem = new WebFXTreeItem(webFXTreeConfig.loadingText);
	if (this.open) {
		this.item.load();
	}else{
		this.add(this._loadingItem);
	}
	webFXTreeHandler.all[this.id] = this;
};

TreeItem.prototype = new WebFXTreeItem;

TreeItem.prototype._webfxtree_expand = WebFXTreeItem.prototype.expand;
TreeItem.prototype.expand = function() {
	this.item.load();
	this._webfxtree_expand();
};

TreeItem.prototype.attachListeners = Tree.prototype.attachListeners;


/*
 * Helper functions
 */
// Converts an xml tree to a js tree. See article about xml tree format
function _itemToTree(item, parentNode) {
	if(parentNode.filter && !parentNode.filter(item)){
		return false;
	}
	var jsNode = new TreeItem(item, null, parentNode);	
	if(item.isLoaded())
	{
		jsNode.loaded = true;
	}
	jsNode.filename = item.getPath();	
	if(parentNode.filter){
		jsNode.filter = parentNode.filter;
	}
    jsNode.overlayIcon = splitOverlayIcons(item);

	item.getChildren().each(function(child){
		var newNode = _itemToTree(child, jsNode);
		if(newNode){
			if(jsNode.filter){
				newNode.filter = jsNode.filter;
			}
            newNode.overlayIcon = splitOverlayIcons(child);
			jsNode.add( newNode , false );
		}
	});	
	return jsNode;	
};
