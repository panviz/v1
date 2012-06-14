/*
 * Description
 */
Class.create("ZohoEditor", View, {

	fullscreenMode: false,
	
	initialize : function($super, oFormObject)
	{
		this.element =  $(oFormObject);
		this.defaultActions = new Hash();		
		this.createTitleSpans();
		modal.setCloseAction(function(){this.close();}.bind(this));
		this.container = $(oFormObject).select('div[id="zohoContainer"]')[0];
		fitHeightToBottom($(this.container), $(modal.elementName));
		this.contentMainContainer = new Element("iframe", {			
			style: "border:none;width:"+this.container.getWidth()+"px;"
		});						
		this.container.update(this.contentMainContainer);
        this.element.observe("view:close", function(){
            var conn = new Connexion();
            conn.addParameter("get_action", "retrieve_from_zohoagent");
            conn.onComplete = function(transport){
                if(transport.responseText == "MODIFIED"){
                    app.fireContextRefresh();
                }
            };
            conn.sendAsync();
        });
	},

	
	open : function($super, userSelection)
	{
		$super(userSelection);		
		this.setOnLoad(true);
		this.currentNode = userSelection.getUniqueNode();
		var fName = this.currentNode.getPath();
		var src = bootstrap.parameters.get('ajxpServerAccess')+"&get_action=post_to_zohoserver&file=" + base64_encode(fName) + "&parent_url=" + base64_encode(getRepName(document.location.href));
		this.contentMainContainer.src = src;
		var pe = new PeriodicalExecuter(function(){
			var href;
			try{
				href = this.contentMainContainer.contentDocument.location.href;
			}catch(e){
				if(this.loading){
					this.resize();
					// Force here for WebKit
					this.contentMainContainer.setStyle({height: this.container.getHeight() + 'px'});
					this.removeOnLoad();	
					pe.stop();		
				}
			}
		}.bind(this) , 0.5);
		return;
	},
	
	setOnLoad: function(openMessage){
		if(this.loading) return;
		addLightboxMarkupToElement(this.container);
		var waiter = new Element("div", {align: "center", style: "font-family:Arial, Helvetica, Sans-serif; font-size:25px; color:#AAA; font-weight:bold;"});
		if(openMessage){
			waiter.update('<br><br><br>Please wait while opening Zoho editor...<br>');
		}
		waiter.insert(new Element("img", {src: ajxpResourcesFolder+'/images/loadingImage.gif'}));
		$(this.container).select("#element_overlay")[0].insert(waiter);
		this.loading = true;
	},
	
	removeOnLoad: function(){
		removeLightboxFromElement(this.container);
		this.loading = false;
	}
	
});
