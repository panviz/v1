/*
 * Description
 */
Class.create("IMagickPreviewer", Diaporama, {

	fullscreenMode: false,

	initialize: function($super, oFormObject)
	{
		$super(oFormObject);
		this.baseUrl = bootstrap.parameters.get('ajxpServerAccess')+"&get_action=get_extracted_page&file=";
		// Override onload for the text
		this.jsImage.onload = function(){
			this.jsImageLoading = false;
			this.imgTag.src = this.jsImage.src;
			this.resizeImage(true);
			this.downloadButton.removeClassName("disabled");
			var i = 0;
			for(i=0;i<this.items.length;i++){
				if(this.items[i] == this.currentFile){
					break;
				}
			}
			i++;
			var text = this.currentIM + ' ('+I18N[331]+' '+i+' '+I18N[332]+' '+this.items.length+')';
			this.updateTitle(text);
		}.bind(this);

        this.resize();
	},
	
	open : function($super, userSelection)
	{
		this.downloadButton.onclick = function(){
			if(!this.currentFile) return;		
			app.triggerDownload(bootstrap.parameters.get('ajxpServerAccess')+'&action=download&file='+userSelection.getUniqueFileName());
			return false;
		}.bind(this);
				
		this.currentIM = getBaseName(userSelection.getUniqueFileName());
		// Extract the pages and load result!
		var connection = new Connection();
		connection.addParameter("get_action", "imagick_data_proxy");
		connection.addParameter("all", "true");
		connection.addParameter("file", userSelection.getUniqueFileName());
		connection.onComplete = function(transport){
			this.removeOnLoad();
			var result = transport.responseJSON;
			this.items = new Array();
			this.sizes = new Hash();			
			for(var i=0;i<result.length;i++){
				this.items.push(result[i].file);
				this.sizes.set(result[i].file, {height: result[i].height, width: result[i].width});
			}
			if(this.items.length){				
				this.currentFile = this.items[0];
				this.setZoomValue(100);
				this.zoomInput.value = '100 %';	
				this.updateImage();
				this.updateButtons();			
				
				var tItems = this.items;
				this.element.observe("view:close", function(){					
					var connection = new Connection();
					connection.addParameter("get_action", "delete_imagick_data");
					var prefix = tItems[0].replace("-0.jpg", "").replace(".jpg", "");
					connection.addParameter("file", prefix);
					connection.sendAsync();
				}.bind(this));
				
			}
		}.bind(this);
		this.setOnLoad();
		this.updateTitle(I18N[330]);
		connection.sendAsync();
	},
						
	getPreview : function(ajxpNode){
		var img = new Element('img', {
			src: IMagickPreviewer.prototype.getThumbnailSource(ajxpNode), 
			style: 'border:1px solid #676965;',
            align: 'absmiddle'
		});
		img.resizePreviewElement = function(dimensionObject){			
			var imgDim = {
				width: 21, 
				height: 29
			};
			var styleObj = fitRectangleToDimension(imgDim, dimensionObject);
			img.setStyle(styleObj);
		}
		return img;
	},
	
	getThumbnailSource : function(ajxpNode){
		return ajxpServerAccessPath+"&get_action=imagick_data_proxy&file="+encodeURIComponent(ajxpNode.getPath());
	},
	
	setOnLoad: function()	{
		if(this.loading) return;
		addLightboxMarkupToElement(this.imgContainer);
		var img = document.createElement("img");
		img.src = ajxpResourcesFolder+'/images/loadingImage.gif';
		$(this.imgContainer).getElementsBySelector("#element_overlay")[0].appendChild(img);
		this.loading = true;
	},
	
	removeOnLoad: function(){
		removeLightboxFromElement(this.imgContainer);
		this.loading = false;
	}
});
