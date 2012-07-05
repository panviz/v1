/**
 * The tree object. Encapsulate the webfx tree.
 * TODO implement as View
 */
Class.create("TreeView", Pane, {
	
	__implements : ["Focusable", "ContextMenuable"],

	/**
	 * Constructor
	 * @param $super klass Superclass reference
	 * @param oElement HTMLElement
	 * @param options Object
	 */
	initialize : function ($super, oElement, options)
{ 
	debugger
		$super(oElement, options);
		this.treeContainer = new Element('div', {id: 'tree_container', style: 'overflow:auto; height:100%; width:100%;'});
		if(this.options.replaceScroller){
				this.scroller = new Element('div', {id: 'tree_scroller', className: 'scroller_track', style: "right:"+(parseInt(oElement.getStyle("marginRight"))-parseInt(oElement.getStyle("paddingRight")))+"px"});
				this.scroller.insert('<div id="scrollbar_handle" class="scroller_handle"></div>');
				oElement.insert(this.scroller);
				this.treeContainer.setStyle({overflow: "hidden"});
		}
		this.registeredObservers = $H();
		oElement.insert(this.treeContainer);
		disableTextSelection(this.treeContainer);
		if(this.options.replaceScroller){
			this.scrollbar = new Control.ScrollBar('tree_container','tree_scroller');
			var scrollbarLayoutObserver = this.scrollbar.recalculateLayout.bind(this.scrollbar);
			document.observe("app:tree_change",  scrollbarLayoutObserver);
			this.registeredObservers.set("app:tree_change", scrollbarLayoutObserver);
		}

		this.options = {};
		if(options){
			this.options = options;
		}
		var thisObject = this;
		var action = function(e){
			if(!app) return;
			app.focusOn(thisObject);
			if(this.item){
				app.actionBar.fireDefaultAction("dir", this.item);
			}
		};
		
		var filter = this.createFilter();
		var fakeRootItem = new Item("/", {"isLeaf": true, "label": I18N[391], "icon": "folder.png", "isLoaded": true});
		this.tree = new Tree(fakeRootItem,  action, filter);		
				
		this.treeContainer.update(this.tree.toString());
		$(this.tree.id).item = this.tree.item;	
		$(this.tree.id).observe("click", function(e){
			this.action(e);
			Event.stop(e);
		}.bind(this.tree));

		AppDroppables.add(this.tree.id);
		if(!this.tree.open && !this.tree.loading) {
			this.tree.toggle();		
		}
		this.treeContainer.observe("click", function(){			
			app.focusOn(this);
		}.bind(this));
	
		this.rootItemId = this.tree.id;
		this.hasFocus;

		var ctxChangedObs = function(event){
			debugger
			
			var path = event.memo.getPath();
			window.setTimeout(function(e){
				debugger
				
				this.setSelectedPath(path);
			}.bind(this), 100);
		}.bind(this);
		document.observe("app:context_changed",  ctxChangedObs);
		this.registeredObservers.set("app:context_changed", ctxChangedObs);

		var rootItemObs = function(event){
			debugger
			
			var rootItem = event.memo;
			this.tree.setRootItem(rootItem);
			this.changeRootLabel(rootItem.getLabel(), rootItem.getIcon());
		}.bind(this);
		document.observe("app:root_item_changed", rootItemObs);
		this.registeredObservers.set("app:root_item_changed", rootItemObs);

		var compConfChanged = function(event){
			
			if(event.memo.className == "FoldersTree"){
				var config = event.memo.classConfig.get('all');
				var options = XPathSelectNodes(config, 'property');
				for(var i=0;i<options.length;i++){
					this.options[options[i].getAttribute('name')] = options[i].getAttribute('value');
				}
				if(this.tree){
					this.tree.filter = this.createFilter();
				}
			}
		}.bind(this);
		document.observe("app:component_config_changed",  compConfChanged);
		this.registeredObservers.set("app:component_config_changed", compConfChanged);
		
	},

    destroy : function(){
			this.registeredObservers.each(function (pair){
					document.stopObserving(pair.key, pair.value);
			});
			if(this.scrollbar) this.scrollbar.destroy();
			if(this.tree) this.tree.destroy();
			if(window[this.htmlElement.id]){
					delete window[this.htmlElement.id];
			}
    },

	/**
	 * Create a filtering function based on the options display
	 * @returns Function
	 */
	createFilter : function(){
		var displayOptions = this.options.display || "dz";
		if(displayOptions.indexOf("a") > -1) displayOptions = "dzf";
		if(displayOptions.indexOf("z") > -1 && window.zipEnabled === false) displayOptions = displayOptions.split("z").join("");
		this.options.display  = displayOptions;

		var d = (displayOptions.indexOf("d") > -1);
		var z = (displayOptions.indexOf("z") > -1);
		var f = (displayOptions.indexOf("f") > -1);
		var filter = function(item){
			return (((d && !item.isLeaf()) || (f && item.isLeaf()) || (z && (item.getMime()=="zip" || item.getMime()=="browsable_archive"))) && (item.getParent().getMime() != "recycle"));
		};
		return filter;		
	},
	
	/**
	 * Focus implementation of Control
	 */
	focus: function(){
		if(webFXTreeHandler.selected)
{ 
			webFXTreeHandler.selected.focus();
		}
		webFXTreeHandler.setFocus(true);
		this.hasFocus = true;
	},
	
	/**
	 * Blur implementation of Control
	 */
	blur: function(){
		if(webFXTreeHandler.selected)
{ 
			webFXTreeHandler.selected.blur();
		}
		webFXTreeHandler.setFocus(false);
		this.hasFocus = false;
	},
		
	/**
	 * Resize implementation of Control
	 */
	resize : function(){
		fitHeightToBottom(this.treeContainer, null);
        if(this.scrollbar){
            this.scroller.setStyle({height: parseInt(this.treeContainer.getHeight())+'px'});
            this.scrollbar.recalculateLayout();
        }
	},
	
	/**
	 * ShowElement implementation of Control
	 */
	showElement : function(show){
		if (show) this.treeContainer.show();
		else this.treeContainer.hide();
	},
	
	/**
	 * Sets the contextual menu
	 * @param protoMenu Proto.Menu 
	 */
	setContextualMenu : function(protoMenu){
        Event.observe(this.rootItemId+'','contextmenu', function(event){
            this.select();
            this.action();
            Event.stop(event);
        }.bind(webFXTreeHandler.all[this.rootItemId]));
         protoMenu.addElements('#'+this.rootItemId+'');
		webFXTreeHandler.contextMenu = protoMenu;
	},
	
	/**
	 * Find a tree node by its path
	 * @param path String
	 * @returns WebFXTreeItem
	 */
	getItemByPath : function(path){
		for(var key in webFXTreeHandler.all){
			if(webFXTreeHandler.all[key] && webFXTreeHandler.all[key].item && webFXTreeHandler.all[key].item.getPath() == path){
				return webFXTreeHandler.all[key];
			}
		}
	},
	
	/**
	 * Finds the node and select it
	 * @param path String
	 */
	setSelectedPath : function(path){
		if(path == "" || path == "/"){
			this.tree.select();
			return;
		}
		var parts = this.cleanPathToArray(path);
		var crtPath = "";
		for(var i=0;i<parts.length;i++){
			crtPath += "/" + parts[i];
			var node = this.getItemByPath(crtPath);
			if(node && node.childItems.length){
				node._webfxtree_expand();
			}			
		}
		if(node){
			node.select();
		}
	},
		
	/**
	 * Transforms url to a path array
	 * @param url String
	 * @returns Array
	 */
	cleanPathToArray: function(url){
		var splitPath = url.split("/");
		var path = new Array();
		var j = 0;
		for(i=0; i<splitPath.length; i++)
{ 
			if(splitPath[i] != '') 
{ 
				path[j] = splitPath[i];
				j++;
			}
		}
		return path;		
	},
		
	/**
	 * Change the root node label
	 * @param newLabel String
	 * @param newIcon String
	 */
	changeRootLabel: function(newLabel, newIcon){
		this.changeItemLabel(this.tree.id, newLabel, newIcon);	
	},
	
	/**
	 * Change a node label
	 * @param nodeId String the Id of the node (webFX speaking)
	 * @param newLabel String
	 * @param newIcon String
	 */
	changeItemLabel: function(nodeId, newLabel, newIcon){	
		var node = $(nodeId+'-label').update(newLabel);
		if(newIcon){
			var realItem = webFXTreeHandler.all[nodeId];
			realItem.icon = newIcon;
			realItem.openIcon = newIcon;
		}
	}
});
