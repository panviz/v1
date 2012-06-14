/**
 * Manages the display of the bookmarks menus. Was a "bookmark bar" but is now a Bookmark button and menu
 */
 Class.create("BookmarksBar", {
	/**
	 * Constructor
	 * @param oElement HTMLElement The main element 
	 */
	initialize : function(oElement){
		this.element = $(oElement);
		this.currentCount = 0;	
		this.bookmarks = $A([]);
		this.createMenu();
		document.observe("app:registry_loaded", function(event){
			this.parseXml(event.memo);
		}.bind(this) );
		document.observeOnce("app:actions_loaded", function(){
			debugger
			var bmAction = app.actionBar.actions.get('bookmark');
			this.addBookmarkObject = {
				name: bmAction.getKeyedText(),
				alt: bmAction.options.title,
				image: ajxpResourcesFolder+'/image/actions/16/bookmark_add.png',
				callback: function(e){
					var node = app.getContextNode();
                    node.getMetadata().set('ajxp_bookmarked', 'true');
                    node.getMetadata().set('overlay_icon', 'bookmark.png');
					this.addBookmark(node.getPath(), node.getLabel());
				}.bind(this)
			};		
		}.bind(this));
		document.observe("app:add_bookmark", function(){
			var node = app.getContextNode();
			this.addBookmark(node.getPath(), node.getLabel());
            node.getMetadata().set('ajxp_bookmarked', 'true');
            node.getMetadata().set('overlay_icon', 'bookmark.png');
		}.bind(this) );
	},
	/**
	 * Parses the registry to find the bookmarks definition
	 * @param registry XMLDocument
	 */
	parseXml : function(registry){
		this.clear();
		var childNodes = XPathSelectNodes(registry, "user/bookmarks/bookmark");
		for (var i=0; i < childNodes.length;i++)
		{
			var bookmark = {
				name: childNodes[i].getAttribute('title'),
				alt: childNodes[i].getAttribute('path'),
				image: ajxpResourcesFolder+'/image/mimes/16/folder.png'
			};
			bookmark.callback = function(e){app.goTo(this.alt);}.bind(bookmark);
			bookmark.moreActions = this.getContextActions(bookmark.alt, bookmark.name);
			this.bookmarks.push(bookmark);
		}
		this.bmMenu.options.menuItems = this.bookmarks;
		this.bmMenu.refreshList();
		if(this.bookmarks.length) this.element.removeClassName('inline_disabled');
		if(modal.pageLoading) modal.updateLoadingProgress('Bookmarks Loaded');
	},
	/**
	 * Creates the sub menu
	 */
	createMenu : function(){
		this.bmMenu = new Proto.Menu({			
			className: 'menu bookmarksMenu',
			mouseClick: 'left',
			anchor: this.element,
			createAnchor: false,
			topOffset: 2,
			leftOffset: 0,
			menuItems: this.bookmarks,
			fade: true,
			zIndex: 2000
		});
	},
		
	/**
	 * Remove all bookmarks and elements
	 */
	clear : function(){
		this.currentCount = 0;
		if(this.addBookmarkObject){
			this.bookmarks = $A([this.addBookmarkObject,{separator: true}]);
		}else{
			this.bookmarks = $A();
		}
		this.element.addClassName('inline_disabled');
		this.bmMenu.options.menuItems = this.bookmarks;
		this.bmMenu.refreshList();		
	},
	
	/**
	 * Gets the bookmark actions for a bookmark
	 * @param bmPath String
	 * @param bmTitle String
	 */
	getContextActions : function(bmPath, bmTitle){
		
		var removeAction = {
				name: MessageHash[146],
				alt: MessageHash[146],
				image: ajxpResourcesFolder+'/image/actions/16/delete_bookmark.png',
				disabled: false,
				className: "edit",
				callback: function(e){
					this.removeBookmark(bmPath);
				}.bind(this)
			};
		
		var renameAction = {
				name: MessageHash[6],
				alt: MessageHash[6],
				image: ajxpResourcesFolder+'/image/actions/16/applix.png',
				disabled: false,
				className: "edit",
				callback: function(e){
					this.toggleRenameForm(bmPath, bmTitle);
				}.bind(this)
			};
		
			
			
		return new Array(renameAction, removeAction);
	},
	
	/**
	 * Create a rename form for renaming bookmark
	 * @param bmPath String
	 * @param bmTitle String
	 */
	toggleRenameForm : function(bmPath, bmTitle){
		
		modal.prepareHeader(MessageHash[225], ajxpResourcesFolder+'/image/actions/16/bookmark.png');
	 	var onLoad = function(newForm){
	 		$(newForm).bm_path.value = bmPath;
	 		$(newForm).bm_title.value = bmTitle;
	 	};
	 	var onComplete = function(){	 		
	 		this.renameBookmark(modal.getForm().bm_path.value, modal.getForm().bm_title.value);
	 		hideLightBox(true);
	 	}.bind(this);
		modal.showDialogForm('Rename', 'rename_bookmark', onLoad, onComplete);
	},
	
	/**
	 * Reload the bookmarks via the registry loading
	 * @param actionsParameters Hash
	 */
	load : function(actionsParameters){
		var connexion = new Connexion();
		if(!actionsParameters) actionsParameters = new Hash();
		actionsParameters.set('get_action', 'get_bookmarks');
		connexion.setParameters(actionsParameters);
		connexion.onComplete = function(transport){
			document.observeOnce("app:registry_part_loaded", function(event){
				if(event.memo != "user/bookmarks") return;
				this.parseXml(app.getXmlRegistry());
			}.bind(this) );			
			app.loadXmlRegistry(false, "user/bookmarks");
			this.bmMenu.refreshList();
			this.bmMenu.show();
		}.bind(this);
		connexion.sendAsync();
	},
	
	/**
	 * Add a bookmark
	 * @param path String
	 * @param title String
	 */
	addBookmark : function(path,title){
		var parameters = new Hash();
		parameters.set('bm_action', 'add_bookmark');
		parameters.set('bm_path', path);
		if(title){
			parameters.set('bm_title', title);
		}
		this.load(parameters);
	},
	
	/**
	 * Remove a bookmark
	 * @param path String
	 */
	removeBookmark : function(path){
		var parameters = new Hash();
		parameters.set('bm_action', 'delete_bookmark');
		parameters.set('bm_path', path);
		this.load(parameters);		
	},
	
	/**
	 * Rename a bookmark
	 * @param path String
	 * @param title String
	 */
	renameBookmark : function(path, title){
		var parameters = new Hash();
		parameters.set('bm_action', 'rename_bookmark');
		parameters.set('bm_path', path);
		parameters.set('bm_title', title);
		this.load(parameters);		
	}
});
