/**
 * The tree object. Encapsulate the webfx tree.
 */
Class.create("FoldersTree", Pane, {
	
	__implements : ["IFocusable", "IContextMenuable"],

	/**
	 * Constructor
	 * @param $super klass Superclass reference
	 * @param oElement HTMLElement
	 * @param options Object
	 */
	initialize : function ($super, oElement, options)
	{
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
            document.observe("application:tree_change",  scrollbarLayoutObserver);
            this.registeredObservers.set("application:tree_change", scrollbarLayoutObserver);
        }


		this.options = {};
		if(options){
			this.options = options;
		}
		var thisObject = this;
		var action = function(e){
			if(!application) return;
			application.focusOn(thisObject);
			if(this.ajxpNode){
				application.actionBar.fireDefaultAction("dir", this.ajxpNode);
			}
		};
		
		var filter = this.createFilter();
		var fakeRootNode = new Node("/", true, MessageHash[391], "folder.png");
		fakeRootNode._isLoaded = true;
		this.tree = new AJXPTree(fakeRootNode,  action, filter);		
				
		this.treeContainer.update(this.tree.toString());
		$(this.tree.id).ajxpNode = this.tree.ajxpNode;	
		$(this.tree.id).observe("click", function(e){
			this.action(e);
			Event.stop(e);
		}.bind(this.tree));

		Droppables.add(this.tree.id);
		if(!this.tree.open && !this.tree.loading) {
			this.tree.toggle();		
		}
		this.treeContainer.observe("click", function(){			
			application.focusOn(this);
		}.bind(this));
	
		this.rootNodeId = this.tree.id;
		this.hasFocus;

        var ctxChangedObs =function(event){
			var path = event.memo.getPath();
			window.setTimeout(function(e){
				this.setSelectedPath(path);
			}.bind(this), 100);
		}.bind(this);
		document.observe("application:context_changed",  ctxChangedObs);
        this.registeredObservers.set("application:context_changed", ctxChangedObs);

        var rootNodeObs = function(event){
			var ajxpRootNode = event.memo;
			this.tree.setRootNode(ajxpRootNode);
			this.changeRootLabel(ajxpRootNode.getLabel(), ajxpRootNode.getIcon());
		}.bind(this);
		document.observe("application:root_node_changed", rootNodeObs);
        this.registeredObservers.set("application:root_node_changed", rootNodeObs);

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
		document.observe("application:component_config_changed",  compConfChanged);
        this.registeredObservers.set("application:component_config_changed", compConfChanged);
		
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
		var filter = function(ajxpNode){
			return (((d && !ajxpNode.isLeaf()) || (f && ajxpNode.isLeaf()) || (z && (ajxpNode.getMime()=="zip" || ajxpNode.getMime()=="ajxp_browsable_archive"))) && (ajxpNode.getParent().getMime() != "ajxp_recycle"));
		};
		return filter;		
	},
	
	/**
	 * Focus implementation of IWidget
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
	 * Blur implementation of IWidget
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
	 * Resize implementation of IWidget
	 */
	resize : function(){
		fitHeightToBottom(this.treeContainer, null);
        if(this.scrollbar){
            this.scroller.setStyle({height: parseInt(this.treeContainer.getHeight())+'px'});
            this.scrollbar.recalculateLayout();
        }
	},
	
	/**
	 * ShowElement implementation of IWidget
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
        Event.observe(this.rootNodeId+'','contextmenu', function(event){
            this.select();
            this.action();
            Event.stop(event);
        }.bind(webFXTreeHandler.all[this.rootNodeId]));
         protoMenu.addElements('#'+this.rootNodeId+'');
		webFXTreeHandler.contextMenu = protoMenu;
	},
	
	/**
	 * Find a tree node by its path
	 * @param path String
	 * @returns WebFXTreeItem
	 */
	getNodeByPath : function(path){
		for(var key in webFXTreeHandler.all){
			if(webFXTreeHandler.all[key] && webFXTreeHandler.all[key].ajxpNode && webFXTreeHandler.all[key].ajxpNode.getPath() == path){
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
			var node = this.getNodeByPath(crtPath);
			if(node && node.childNodes.length){
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
		this.changeNodeLabel(this.tree.id, newLabel, newIcon);	
	},
	
	/**
	 * Change a node label
	 * @param nodeId String the Id of the node (webFX speaking)
	 * @param newLabel String
	 * @param newIcon String
	 */
	changeNodeLabel: function(nodeId, newLabel, newIcon){	
		var node = $(nodeId+'-label').update(newLabel);
		if(newIcon){
			var realNode = webFXTreeHandler.all[nodeId];
			realNode.icon = newIcon;
			realNode.openIcon = newIcon;
		}
	}
});
