/*
 * Ajaxplorer wrapper for CodeMirror
 */
Class.create("CodeMirrorEditor", AbstractEditor, {

	initialize : function($super, element, options)
	{
		$super(element, options);
		
		this.textWrapping = false;
		this.lineNumbers = true;
		this.indentSize = 2;		
		
		if(!app.user || app.user.canWrite()){
			this.canWrite = true;
			this.actions.get("saveButton").observe('click', function(){
				this.saveFile();
				return false;
			}.bind(this));		
		}else{
			this.canWrite = false;
			this.actions.get("saveButton").hide();
		}
		this.actions.get("downloadFileButton").observe('click', function(){
			if(!this.currentFile) return;		
			app.triggerDownload(bootstrap.parameters.get('ajxpServerAccess')+'&action=download&file='+this.currentFile);
			return false;
		}.bind(this));
	
		this.actions.get("toggleLinesButton").observe('click', function(){
			if(this.codeMirror){
				this.lineNumbers = !this.codeMirror.lineNumbers;
				this.codeMirror.setLineNumbers(this.lineNumbers);
			}
			return false;
		}.bind(this));		
		
		this.actions.get("toggleWrapButton").observe('click', function(){
			if(this.codeMirror){
				this.textWrapping = !this.codeMirror.options.textWrapping;
				this.codeMirror.setTextWrapping(this.textWrapping);
			}
			return false;
		}.bind(this));		
		
		this.actions.get("undoButton").observe('click', function(){
			if(this.codeMirror){
				this.codeMirror.undo();
			}
			return false;
		}.bind(this));		
		
		this.actions.get("redoButton").observe('click', function(){
			if(this.codeMirror){
				this.codeMirror.redo();
			}
			return false;
		}.bind(this));		
		
		this.element.down('#goto_line').observe('keypress', function(event){
			if(event.keyCode == Event.KEY_RETURN && this.codeMirror){
				this.codeMirror.jumpToLine(parseInt(event.target.value));
			}			
		}.bind(this) );
		
		this.element.down('#text_search').observe('keypress', function(event){
			if(event.keyCode == Event.KEY_RETURN && this.codeMirror){
				var cursor;
				if(this.currentSearch && this.currentSearch == event.target.value && this.currentCursor){
					cursor = this.currentCursor;
				}else{
					cursor = this.codeMirror.getSearchCursor(event.target.value, false, false);
				}
				if(cursor.findNext()){
					cursor.select();
					this.currentSearch = event.target.value;
					this.currentCursor = cursor;
				}else{
					this.currentSearch = "";
					this.currentCursor = null;
				}
			}			
		}.bind(this) );
		
		// Remove python rule, if any
		$$('link[href="plugins/editor.codemirror/css/linenumbers-py.css"]').invoke('remove');
		
	},
	
	open : function($super, userSelection){
		$super(userSelection);
		var fileName = userSelection.getUniqueFileName();
		
		var path = 'plugins/editor.codemirror/CodeMirror/';
		var extension = getFileExtension(fileName);
		var parserFile; var styleSheet;
		var parserConfig = {};
		switch(extension){
			case 'js':
			case 'json':
				parserFile = ["tokenizejavascript.js", "parsejavascript.js"];
				styleSheet = path+"css/jscolors.css";
				if(extension == 'json') parserConfig.json = true;
			break;
			case 'xml':
				parserFile = "parsexml.js";
				styleSheet = path+"css/xmlcolors.css";
			break;
			case 'css':
				parserFile = "parsecss.js";
				styleSheet = path+"css/csscolors.css";
			break;
			case 'html':
				parserFile = ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "parsehtmlmixed.js"];
				styleSheet =[path+"css/xmlcolors.css", path+"css/jscolors.css", path+"css/csscolors.css"];
			break;
			case 'sparql':
				parserFile = "parsesparql.js";
				styleSheet = path+"css/sparqlcolors.css";
			break;
			case 'php':
			case 'phtml':
				parserFile = ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "../contrib/php/js/tokenizephp.js", "../contrib/php/js/parsephp.js", "../contrib/php/js/parsephphtmlmixed.js"];
				styleSheet =[path+"css/xmlcolors.css", path+"css/jscolors.css", path+"css/csscolors.css", path+"/contrib/php/css/phpcolors.css"];				
			break;
			case 'py':
				parserFile = "../contrib/python/js/parsepython.js";
				styleSheet = path+"contrib/python/css/pythoncolors.css";
				ResourcesManager.prototype.loadCSSResource('plugins/editor.codemirror/css/linenumbers-py.css');
			break;
			case 'lua':
				parserFile = "../contrib/lua/js/parselua.js";
				styleSheet = path+"contrib/python/css/luacolors.css";
			break;
			case 'c#':
			    parserFile =  ["../contrib/csharp/js/tokenizecsharp.js", "../contrib/csharp/js/parsecsharp.js"];
			    styleSheet =  path+"contrib/csharp/css/csharpcolors.css";
			break;
			case 'java':
			case 'jsp':
			    parserFile =  ["../contrib/java/js/tokenizejava.js","../contrib/java/js/parsejava.js"];
			    styleSheet =  path+"contrib/java/css/javacolors.css";
			break;
			case 'sql':
			    parserFile =  "../contrib/sql/js/parsesql.js";
			    styleSheet =  path+"contrib/sql/css/sqlcolors.css";
			break;
			case 'xquery':
			    parserFile =  ["../contrib/xquery/js/tokenizexquery.js","../contrib/xquery/js/parsexquery.js"];
			    styleSheet =  path+"contrib/xquery/css/xquerycolors.css";
			break;
			default:
				parserFile = "parsedummy.js";
				styleSheet = path + '../css/dummycolors.css';
			break;
		}
		this.options = 	{
			path: path + 'js/',
			parserfile: parserFile,
			stylesheet: styleSheet,
			parserConfig: parserConfig,
			onChange: function(){ 				
				this.updateHistoryButtons();
				var sizes = this.codeMirror.historySize();
				if(sizes.undo){
					this.setModified(true);
				}else{
					this.setModified(false);
				}
			}.bind(this)
		};
		
		
		this.initCodeMirror(false, function(){
			this.loadFileContent(fileName);
		}.bind(this));
		
		this.element.observe("view:enterFS", function(e){
			this.currentCode = this.codeMirror.getCode();
            this.goingToFullScreen = true;
			this.destroyCodeMirror();
		}.bind(this) );

		this.element.observe("view:enterFSend", function(e){
			this.initCodeMirror(true);
			this.codeMirror.setLineNumbers(this.codeMirror.lineNumbers);
		}.bind(this) );

		this.element.observe("view:exitFS", function(e){
			this.currentCode = this.codeMirror.getCode();
			this.destroyCodeMirror();
		}.bind(this) );

		this.element.observe("view:exitFSend", function(e){
			this.initCodeMirror();
			this.codeMirror.setLineNumbers(this.codeMirror.lineNumbers);
            this.goingToFullScreen = false;
		}.bind(this) );

		this.updateHistoryButtons();
		
		if(window.ajxpMobile){
			this.setFullScreen();
			//attachMobileScroll(this.textarea, "vertical");
		}

        this.element.observe("view:resize", function(event){
            if(this.goingToFullScreen) return;
            fitHeightToBottom($(this.contentMainContainer), $(modal.elementName));
            fitHeightToBottom($(this.element), $(modal.elementName));
            fitHeightToBottom(this.codeMirror.wrapping);
        }.bind(this));
	},
	
	updateHistoryButtons : function(){
		var sizes = $H({undo: 0,redo: 0});
		if(this.codeMirror){
			try{
				sizes = $H(this.codeMirror.historySize());
			}catch(e){}
		}
		var actions = this.actions;
		sizes.each(function(pair){
			actions.get(pair.key+"Button")[(pair.value ? 'removeClassName' : 'addClassName')]('disabled');
		});
	},
	
	initCodeMirror : function(fsMode, onLoad){

		this.options.indentUnit = this.indentSize;
		this.options.textWrapping = this.textWrapping;
		this.options.lineNumbers = this.lineNumbers;

		this.options.onLoad = onLoad ? onLoad : function(mirror){
			if(this.currentCode){
				var mod = this.isModified;
				mirror.setCode(this.currentCode);
				if(!mod){
					this.setModified(false);
				}
			}
		}.bind(this);		
		
		this.codeMirror = new CodeMirror(function(iFrame){
				this.contentMainContainer = iFrame;
				this.element.insert({bottom: iFrame});
				if(fsMode){
					fitHeightToBottom($(this.contentMainContainer));
				}else{
					fitHeightToBottom($(this.contentMainContainer), $(modal.elementName));
					fitHeightToBottom($(this.element), $(modal.elementName));
				}
			}.bind(this), this.options);			
	},
		
	destroyCodeMirror : function(){
		if(this.contentMainContainer){
			this.contentMainContainer.remove();
		}
	},
	
	loadFileContent : function(fileName){
		
		this.currentFile = fileName;
		var connection = new Connection();
		connection.addParameter('get_action', 'get_content');
		connection.addParameter('file', fileName);	
		connection.onComplete = function(transp){
			this.parseTxt(transp);
			this.updateTitle(getBaseName(fileName));
		}.bind(this);
		this.setModified(false);
		this.setOnLoad(this.contentMainContainer);
		connection.sendAsync();
	},
	
	prepareSaveConnection : function(){
		var connection = new Connection();
		connection.addParameter('get_action', 'put_content');
		connection.addParameter('file', this.userSelection.getUniqueFileName());
		connection.addParameter('dir', this.userSelection.getCurrentRep());	
		connection.onComplete = function(transp){
			this.parseXml(transp);			
		}.bind(this);
		this.setOnLoad(this.contentMainContainer);
		connection.setMethod('put');		
		return connection;
	},
	
	saveFile : function(){
		var connection = this.prepareSaveConnection();
		connection.addParameter('content', this.codeMirror.getCode());		
		connection.sendAsync();
	},
	
	parseXml : function(transport){
		if(parseInt(transport.responseText).toString() == transport.responseText){
			alert("Cannot write the file to disk (Error code: "+transport.responseText+")");
		}else{
			this.setModified(false);
		}
		this.removeOnLoad(this.contentMainContainer);
	},
	
	parseTxt : function(transport){	
		this.codeMirror.setCode(transport.responseText);
		this.setModified(false);
		this.codeMirror.clearHistory();
		this.updateHistoryButtons();
		this.removeOnLoad(this.contentMainContainer);
	}
});
