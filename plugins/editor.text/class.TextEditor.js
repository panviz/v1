/*
 * Description
 */
Class.create("TextEditor", View, {

	initialize : function($super, oFormObject, options)
	{
		$super(oFormObject, options);
		if(!ajaxplorer.user || ajaxplorer.user.canWrite()){
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
			ajaxplorer.triggerDownload(bootstrap.parameters.get('ajxpServerAccess')+'&action=download&file='+this.currentFile);
			return false;
		}.bind(this));
	},
	
	
	open : function($super, userSelection){
		$super(userSelection);
		var fileName = userSelection.getUniqueFileName();
		var textarea;
		this.textareaContainer = document.createElement('div');
		this.textarea = $(document.createElement('textarea'));
		this.textarea.name =  this.textarea.id = 'content';
		this.textarea.addClassName('dialogFocus');
		this.textarea.addClassName('editor');
		this.currentUseCp = false;
		this.contentMainContainer = this.textarea;
		this.textarea.setStyle({width: '100%'});	
		this.textarea.setAttribute('wrap', 'off');	
		if(!this.canWrite){
			this.textarea.readOnly = true;
		}
		this.element.appendChild(this.textareaContainer);
		this.textareaContainer.appendChild(this.textarea);
		fitHeightToBottom($(this.textarea), $(modal.elementName));
		// LOAD FILE NOW
		this.loadFileContent(fileName);
		if(window.ajxpMobile){
			this.setFullScreen();
			attachMobileScroll(this.textarea, "vertical");
		}		
	},
	
	loadFileContent : function(fileName){
		this.currentFile = fileName;
		var connexion = new Connexion();
		connexion.addParameter('get_action', 'get_content');
		connexion.addParameter('file', fileName);	
		connexion.onComplete = function(transp){
			this.parseTxt(transp);
			this.updateTitle(getBaseName(fileName));
		}.bind(this);
		this.setModified(false);
		this.setOnLoad(this.textareaContainer);
		connexion.sendAsync();
	},
	
	prepareSaveConnexion : function(){
		var connexion = new Connexion();
		connexion.addParameter('get_action', 'put_content');
		connexion.addParameter('file', this.userSelection.getUniqueFileName());
		connexion.addParameter('dir', this.userSelection.getCurrentRep());	
		connexion.onComplete = function(transp){
			this.parseXml(transp);			
		}.bind(this);
		this.setOnLoad(this.textareaContainer);
		connexion.setMethod('put');		
		return connexion;
	},
	
	saveFile : function(){
		var connexion = this.prepareSaveConnexion();
		connexion.addParameter('content', this.textarea.value);		
		connexion.sendAsync();
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
		if(this.canWrite){
			var contentObserver = function(el, value){
				this.setModified(true);
			}.bind(this);
			new Form.Element.Observer(this.textarea, 0.2, contentObserver);
		}
		this.removeOnLoad(this.textareaContainer);
	}
});
