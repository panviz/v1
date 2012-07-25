/**
 * The Search Engine abstraction.
 */
Class.create("Search.Engine", Pane, {

	/**
	 * @var HTMLElement
	 */
	htmlElement: undefined,
	_inputBox: undefined,
	_resultsBoxId: undefined,
	_searchButtonName: undefined,
	/**
	 * @var String Default 'idle'
	 */
	state: 'idle',
	_runningQueries: undefined,
	_queriesIndex: 0,
	_options: undefined,
	
	_queue : undefined,

    _searchMode : "local",
    _even : false,

	/**
	 * Constructor
	 * @param $super klass Superclass reference
	 * @param mainElementName String
	 * @param options Object
	 */
	initialize : function($super, mainElementName, options)
	{
        this._options = {};
        if($(mainElementName).getAttribute("data-globalOptions")){
            this._options = $(mainElementName).getAttribute("data-globalOptions").evalJSON();
        }
        if(options){
            this._options = Object.extend(this._options, options);
        }
		$super($(mainElementName), this._options);
        this.updateSearchModeFromRegistry();
        document.observe("app:registry_loaded", this.updateSearchModeFromRegistry.bind(this));
		this.initGUI();
	},

    updateSearchModeFromRegistry : function(){
																		 debugger
        if($(this._resultsBoxId)){
            $(this._resultsBoxId).update('');
        }
        var reg = app.getXmlRegistry();
        var indexerNode = XPathSelectSingleNode(reg, "plugins/indexer");
        if(indexerNode != null){
            if(indexerNode.getAttribute("indexed_meta_fields")){
                this.indexedFields = indexerNode.getAttribute("indexed_meta_fields").evalJSON();
                if(this.indexedFields["indexed_meta_fields"]){
                    var addColumns = this.indexedFields["additionnal_meta_columns"];
                    this.indexedFields = $A(this.indexedFields["indexed_meta_fields"]);
                    if(!this._options.metaColumns) this._options.metaColumns = {};
                    for(var key in addColumns){
                        this._options.metaColumns[key] = addColumns[key];
                    }
                }else{
                    this.indexedFields = $A(this.indexedFields);
                }
            }else{
                this.indexedFields = $A();
            }
            this._searchMode = "remote";
        }else{
            this._searchMode = "local";
        }
    },

	/**
	 * Creates the HTML
	 */
	initGUI : function(){
		
		if(!this.htmlElement) return;
		
		this.htmlElement.insert('<div id="search_panel"><div id="search_form"><input style="float:left;" type="text" id="search_txt" name="search_txt" onfocus="blockEvents=true;" onblur="blockEvents=false;"><a href="" id="search_button" ajxp_message_title_id="184" title="'+I18N[184]+'"><img width="16" height="16" align="absmiddle" src="'+THEME.path+'/image/action/16/search.png" border="0"/></a><a href="" id="stop_search_button" ajxp_message_title_id="185" title="'+I18N[185]+'"><img width="16" height="16" align="absmiddle" src="'+THEME.path+'/image/action/16/fileclose.png" border="0" /></a></div><div id="search_results"></div></div>');
        if(this.htmlElement.down('div.panelHeader')){
            this.htmlElement.down('div#search_panel').insert({top: this.htmlElement.down('div.panelHeader')});
        }
		
		this.metaOptions = [];
		if(this._ajxpOptions && this._ajxpOptions.metaColumns){
            var cols = this._ajxpOptions.metaColumns;
			$('search_form').insert({bottom: '<div id="search_meta">'+I18N[344]+' : <span id="search_meta_options"></span></div>'});
			this.initMetaOption($('search_meta_options'), 'filename', I18N[1], true);
			for(var key in cols){
                if(this.indexedFields && !this.indexedFields.include(key)) continue;
				this.initMetaOption($('search_meta_options'), key, cols[key]);
			}
		}else{
			$('search_form').insert('<div style="clear:left; height:9px;"></div>');
		}
		
		this._inputBox = $("search_txt");
		this._resultsBoxId = 'search_results';
		this._searchButtonName = "search_button";
		this._runningQueries = new Array();
		this._queue = $A([]);
		
		$('stop_'+this._searchButtonName).addClassName("disabled");
		
		this.htmlElement.select('a', 'div[id="search_results"]').each(function(element){
			disableTextSelection(element);
		});
        
		this._inputBox.observe("keydown", function(e){
            if(e.keyCode == Event.KEY_RETURN) {
                Event.stop(e);
                this.search();
            }
			if(e.keyCode == Event.KEY_TAB) return false;
			return true;		
		}.bind(this));
		
		this._inputBox.observe("focus", function(e){
			app.disableShortcuts();
			app.disableNavigation();
			this.hasFocus = true;
			this._inputBox.select();
			return false;
		}.bind(this));
			
		this._inputBox.observe("blur", function(e){
			app.enableShortcuts();
            app.enableNavigation();
			this.hasFocus = false;
		}.bind(this));
		
		$(this._searchButtonName).onclick = function(){
			this.search();
			return false;
		}.bind(this);
		
		$('stop_'+this._searchButtonName).onclick = function(){
			this.interrupt();
			return false;
		}.bind(this);
		
		this.resize();
	},
	/**
	 * Show/Hide the widget
	 * @param show Boolean
	 */
	showElement : function(show){
		if(!this.htmlElement) return;
		if(show) this.htmlElement.show();
		else this.htmlElement.hide();
	},
	/**
	 * Resize the widget
	 */
	resize : function(){
		fitHeightToBottom($(this._resultsBoxId));
		if(this.htmlElement && this.htmlElement.visible()){
			//this._inputBox.setStyle({width: Math.max((this.htmlElement.getWidth() - this.htmlElement.getStyle("paddingLeft")- this.htmlElement.getStyle("paddingRight") -70),70) + "px"});
		}
	},
	
	destroy : function(){
		if(this.htmlElement) {
            var id = this.htmlElement.id;
            this.htmlElement.update('');
        }
		this.htmlElement = null;
        if(id && window[id]){
            try {delete window[id];}catch(e){}
        }
	},
	/**
	 * Initialise the options for search Metadata
	 * @param element HTMLElement
	 * @param optionValue String
	 * @param optionLabel String
	 * @param checked Boolean
	 */
	initMetaOption : function(element, optionValue, optionLabel, checked){
		var option = new Element('meta_opt', {value: optionValue}).update(optionLabel);
		if(checked) option.addClassName('checked');
		if(element.childElements().length) element.insert(', ');
		element.insert(option);
		option.observe('click', function(event){
			option.toggleClassName('checked');
		});
		this.metaOptions.push(option);
	},
	/**
	 * Check wether there are metadata search selected
	 * @returns Boolean
	 */
	hasMetaSearch : function(){
		var found = false;
		this.metaOptions.each(function(opt){
			if(opt.getAttribute("value")!="filename" && opt.hasClassName("checked")) found = true;
		});
		return found;
	},
	/**
	 * Get the searchable columns
	 * @returns $A()
	 */
	getSearchColumns : function(){
		var cols = $A();
		this.metaOptions.each(function(opt){
			if(opt.hasClassName("checked")) cols.push(opt.getAttribute("value"));
		});
		return cols;
	},
	/**
	 * Focus on this widget (focus input)
	 */
	focus : function(){
		if(this.htmlElement && this.htmlElement.visible()){
			this._inputBox.activate();
			this.hasFocus = true;
		}
	},
	/**
	 * Blur this widget
	 */
	blur : function(){
		if(this._inputBox){
			this._inputBox.blur();
		}
		this.hasFocus = false;
	},
	/**
	 * Perform search
	 */
	search : function(){
		var text = this._inputBox.value;
		if(text == '') return;
		this.crtText = text.toLowerCase();
		this.updateStateSearching();
		this.clearResults();
		var folder = app.getContextNode().getPath();
		if(folder == "/") folder = "";
		window.setTimeout(function(){
			this.searchFolderContent(folder);
		}.bind(this), 0);		
	},
	/**
	 * stop search
	 */
	interrupt : function(){
		// Interrupt current search
		if(this._state == 'idle') return;
		this._state = 'interrupt';
		this._queue = $A();
	},
	/**
	 * Update GUI for indicating state
	 */
	updateStateSearching : function (){
		this._state = 'searching';
		//try{this._inputBox.disabled = true;}catch(e){}
		$(this._searchButtonName).addClassName("disabled");
		$('stop_'+this._searchButtonName).removeClassName("disabled");
	},
	/**
	 * Search is finished
	 * @param interrupt Boolean
	 */
	updateStateFinished : function (interrupt){
		this._state = 'idle';
		this._inputBox.disabled = false;
		$(this._searchButtonName).removeClassName("disabled");
		$('stop_'+this._searchButtonName).addClassName("disabled");
	},
	/**
	 * Clear all results and input box
	 */
	clear : function(){
		this.clearResults();
		if(this._inputBox){
			this._inputBox.value = "";
		}
	},
	/**
	 * Clear all results
	 */
	clearResults : function(){
		// Clear the results	
		while($(this._resultsBoxId).childNodes.length)
		{
			$(this._resultsBoxId).removeChild($(this._resultsBoxId).childNodes[0]);
		}
        this._even = false;
	},
	/**
	 * Add a result to the list - Highlight search term
	 * @param folderName String
	 * @param item Node
	 * @param metaFound String
	 */
	addResult : function(folderName, item, metaFound){
		var fileName = item.getLabel();
		var icon = item.getIcon();
		// Display the result in the results box.
		if(folderName == "") folderName = "/";
        if(this._searchMode == "remote"){
            folderName = getRepName(item.getPath());
        }
		var isFolder = false;
		if(icon == null) // FOLDER CASE
		{
			isFolder = true;
			icon = 'folder.png';
			if(folderName != "/") folderName += "/";
			folderName += fileName;
		}
        var imgPath = resolveImageSource(icon, '/image/mime/16', 16);
		var imageString = '<img align="absmiddle" width="16" height="16" src="'+imgPath+'"> ';
		var stringToDisplay;
		if(metaFound){
			stringToDisplay = fileName + ' (' + this.highlight(metaFound, this.crtText, 20)+ ') ';
		}else{
			stringToDisplay = this.highlight(fileName, this.crtText);
		}
		
		var divElement = new Element('div', {title: I18N[224]+' '+ folderName, className: (this._even ? 'even' : '')}).update(imageString+stringToDisplay);
        this._even = !this._even;
		$(this._resultsBoxId).insert(divElement);
        if(this._searchMode == 'remote' && item.getMetadata().get("search_score")){
            /*divElement.insert(new Element('a', {className: "searchUnindex"}).update("X"));*/
            divElement.insert(new Element('span', {className: "searchScore"}).update("SCORE "+item.getMetadata().get("search_score")));
        }
		if(isFolder)
		{
			divElement.observe("click", function(e){
				app.goTo(folderName);
			});
		}
		else
		{
			divElement.observe("click", function(e){
				app.getContextHolder().setPendingSelection(fileName);
				app.goTo(folderName);
			});
		}
	},
    addNoResultString : function(){
        $(this._resultsBoxId).insert(new Element('div').update("No results found."));
    },
	/**
	 * Put a folder to search in the queue
	 * @param path String
	 */
	appendFolderToQueue : function(path){
		this._queue.push(path);
	},
	/**
	 * Process the next element of the queue, or finish
	 */
	searchNext : function(){
		if(this._queue.length){
			var path = this._queue.first();
			this._queue.shift();
			this.searchFolderContent(path);
		}else{
			this.updateStateFinished();
		}
	},
	/**
	 * Get a folder content and searches its children 
	 * Should reference the INodeProvider instead!! Still a "ls" here!
	 * @param currentFolder String
	 */
	searchFolderContent : function(currentFolder){
		if(this._state == 'interrupt') {
			this.updateStateFinished();
			return;
		}
        if(this._searchMode == "remote"){
            /* REMOTE INDEXER CASE */
            var connection = new Connection();
            connection.addParameter('get_action', 'search');
            connection.addParameter('query', this.crtText);
            if(this.hasMetaSearch()){
                connection.addParameter('fields', this.getSearchColumns().join(','));
            }
            connection.onComplete = function(transport){
                this._parseResults(transport.responseXML, currentFolder);
                this.updateStateFinished();
                this.removeOnLoad($(this._resultsBoxId));
            }.bind(this);
            this.setOnLoad($(this._resultsBoxId));
            connection.sendAsync();
        }else{
            /* LIST CONTENT, SEARCH CLIENT SIDE, AND RECURSE */
            var connection = new Connection();
            connection.addParameter('get_action', 'ls');
            connection.addParameter('options', 'a' + (this.hasMetaSearch() ? 'l' : ''));
            connection.addParameter('dir', currentFolder);
            connection.onComplete = function(transport){
                this._parseXmlAndSearchString(transport.responseXML, currentFolder);
                this.searchNext();
            }.bind(this);
            connection.sendAsync();
        }
	},
	
	_parseXmlAndSearchString : function(oXmlDoc, currentFolder){
		if(this._state == 'interrupt'){
			this.updateStateFinished();
			return;
		}
		if( oXmlDoc == null || oXmlDoc.documentElement == null){
			//alert(currentFolder);
		}else{
			var nodes = XPathSelectNodes(oXmlDoc.documentElement, "tree");
			for (var i = 0; i < nodes.length; i++) 
			{
				if (nodes[i].tagName == "tree") 
				{
					var node = this.parseNode(nodes[i]);					
					this._searchNode(node, currentFolder);
					if(!node.isLeaf())
					{
						var newPath = node.getPath();
						this.appendFolderToQueue(newPath);
					}
				}
			}		
		}
	},
	
	_parseResults : function(oXmlDoc, currentFolder){
		if(this._state == 'interrupt' || oXmlDoc == null || oXmlDoc.documentElement == null){
			this.updateStateFinished();
			return;
		}
		var nodes = XPathSelectNodes(oXmlDoc.documentElement, "tree");
        if(!nodes.length){
            this.addNoResultString();
        }
		for (var i = 0; i < nodes.length; i++) 
		{
			if (nodes[i].tagName == "tree") 
			{
				var item = this.parseNode(nodes[i]);
                if(this.hasMetaSearch()){
                    var searchCols = this.getSearchColumns();
                    var added = false;
                    for(var k=0;k<searchCols.length;k++){
                        var meta = item.getMetadata().get(searchCols[k]);
                        if(meta && meta.toLowerCase().indexOf(this.crtText) != -1){
                            this.addResult(currentFolder, item, meta);
                            added = true;
                        }
                    }
                    if(!added){
                        this.addResult(currentFolder, item);
                    }
                }else{
				    this.addResult(currentFolder, item);
                }
			}
		}		
		
	},
	
	_searchNode : function(item, currentFolder){
		var searchFileName = true;
		var searchCols;
		if(this.hasMetaSearch()){
			searchCols = this.getSearchColumns();
			if(!searchCols.indexOf('filename')){
				searchFileName = false;
			}
		}
		if(searchFileName && item.getLabel().toLowerCase().indexOf(this.crtText) != -1){
			this.addResult(currentFolder, item);
			return;
		}
		if(!searchCols) return;
		for(var i=0;i<searchCols.length;i++){
			var meta = item.getMetadata().get(searchCols[i]);
			if(meta && meta.toLowerCase().indexOf(this.crtText) != -1){
				this.addResult(currentFolder, item, meta);
				return;			
			}
		}
	},
	/**
	 * Parses an XMLNode and create an Node
	 * @param xmlNode XMLNode
	 * @returns Node
	 */
	parseNode : function(xmlNode){
		var node = new Node(
			xmlNode.getAttribute('filename'), 
			(xmlNode.getAttribute('is_file') == "1" || xmlNode.getAttribute('is_file') == "true"), 
			xmlNode.getAttribute('text'),
			xmlNode.getAttribute('icon'));
		var reserved = ['filename', 'is_file', 'text', 'icon'];
		var metadata = new Hash();
		for(var i=0;i<xmlNode.attributes.length;i++)
		{
			metadata.set(xmlNode.attributes[i].nodeName, xmlNode.attributes[i].nodeValue);
			if(Prototype.Browser.IE && xmlNode.attributes[i].nodeName == "ID"){
				metadata.set("sql_"+xmlNode.attributes[i].nodeName, xmlNode.attributes[i].nodeValue);
			}
		}
		node.setMetadata(metadata);
		return node;
	},
	/**
	 * Highlights a string with the search term
	 * @param haystack String
	 * @param needle String
	 * @param truncate Integer
	 * @returns String
	 */
	highlight : function(haystack, needle, truncate){
		var start = haystack.toLowerCase().indexOf(needle);
        if(start == -1) return haystack;
		var end = start + needle.length;
		if(truncate && haystack.length > truncate){
			var midTrunc = Math.round(truncate/2);
			var newStart = Math.max(Math.round((end + start) / 2 - truncate / 2), 0);
			var newEnd = Math.min(Math.round((end + start) / 2 + truncate / 2),haystack.length);
			haystack = haystack.substring(newStart, newEnd);
			if(newStart > 0) haystack = '...' + haystack;
			if(newEnd < haystack.length) haystack = haystack + '...';
			// recompute
			start = haystack.toLowerCase().indexOf(needle);
			end = start + needle.length;
		}
		var highlight = haystack.substring(0, start)+'<em>'+haystack.substring(start, end)+'</em>'+haystack.substring(end);
		return highlight;
	},

    /**
     * Add a loading image to the given element
     * @param element Element dom node
     */
    setOnLoad : function(element){
        addLightboxMarkupToElement(element);
        var img = new Element("img", {src : THEME.path+"/image/loadingImage.gif", style: "margin-top: 10px;"});
        $(element).down("#element_overlay").insert(img);
        this.loading = true;
    },
    /**
     * Removes the image from the element
     * @param element Element dom node
     */
    removeOnLoad : function(element){
        removeLightboxFromElement(element);
        this.loading = false;
    }
});
