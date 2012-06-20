/*
 * Description
 */
Class.create("TextEditor", View, {

	initialize : function($super, oFormObject, options)
	{
		$super(oFormObject, options);
		if(!app.user || app.user.canWrite()){
			this.writable = true;
			this.actions.get("saveButton").observe('click', function(){
				this.saveFile();
				return false;
			}.bind(this));		
		}else{
			this.writable = false;
			this.actions.get("saveButton").hide();
		}
		this.actions.get("downloadFileButton").observe('click', function(){
			if(!this.currentFile) return;		
			app.triggerDownload(bootstrap.parameters.get('serverAccess')+'&action=download&file='+this.currentFile);
			return false;
		}.bind(this));
		this.textareaContainer = document.createElement('div');
		this.textarea = $(document.createElement('textarea'));
		this.textarea.name = this.textarea.id = 'content';
		this.textarea.addClassName('editor');
		this.textarea.addClassName('dialogFocus');
		this.contentMainContainer = this.textarea;
		this.textarea.setStyle({width: '100%'});	
		this.textarea.setAttribute('wrap', 'off');	
		if(!this.writable){
			this.textarea.readOnly = true;
		}
		this.element.appendChild(this.textareaContainer);
		this.textareaContainer.appendChild(this.textarea);
	},
	
	open : function($super, userSelection){
		$super(userSelection);
		var fileName = userSelection.getUniqueFileName();
		//TODO set focus
		fitHeightToBottom($(this.textarea), this.element);
		// LOAD FILE NOW
		this.loadFileContent(fileName);
		if(window.ajxpMobile){
			this.setFullScreen();
			attachMobileScroll(this.textarea, "vertical");
		}		
	},
	
	loadFileContent : function(fileName){
		this.currentFile = fileName;
		var connection = new Connection();
		connection.addParameter('get_action', 'get_content');
		connection.addParameter('file', fileName);	
		connection.onComplete = function(transp){
			//TODO doesn't called on missing file
			this.parseTxt(transp);
			this.updateTitle(getBaseName(fileName));
		}.bind(this);
		this.setModified(false);
		this.setOnLoad(this.textareaContainer);
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
		this.setOnLoad(this.textareaContainer);
		connection.setMethod('put');		
		return connection;
	},
	
	saveFile : function(){
		var connection = this.prepareSaveConnection();
		connection.addParameter('content', this.textarea.value);		
		connection.sendAsync();
	},
	
	parseXml : function(transport){
		if(parseInt(transport.responseText).toString() == transport.responseText){
			alert("Cannot write the file to disk (Error code : "+transport.responseText+")");
		}else{
			this.setModified(false);
		}
		this.removeOnLoad(this.textareaContainer);
	},
	
	parseTxt : function(transport){	
		this.textarea.value = transport.responseText;
		if(this.writable){
			var contentObserver = function(el, value){
				this.setModified(true);
			}.bind(this);
			new Form.Element.Observer(this.textarea, 0.2, contentObserver);
		}
		this.removeOnLoad(this.textareaContainer);
	},

	clearContent : function(){
		this.textarea.innerHTML = '';
	}
});
