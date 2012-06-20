Class.create("Splash", Action, {
	execute : function(){
		modal.showDialogForm(
			'Application', 
			'splash_form', 
			function(oForm){
				var docDiv = $(oForm).down('#docDiv');
				if(!docDiv.isLoaded){
					var conn = new Connexion(window.ajxpServerAccessPath + '&get_action=display_doc&doc_file=CREDITS');
					conn.onComplete = function(transport){
						docDiv.insert({top:transport.responseText});
						docDiv.isLoaded = true;
						var updateLink = docDiv.down('#software_update');
						if(!updateLink) return;
						updateLink.setStyle({cursor:'pointer'});
						updateLink.observeOnce("click", function(){
							var checkConn = new Connexion();
							checkConn.addParameter("get_action", "check_software_update");
							updateLink.update(t("Checking..."));
							updateLink.setStyle({cursor:'default',color:'black'});
							checkConn.onComplete= function(trans){
								updateLink.update(trans.responseText);
							};
							checkConn.sendSync();
						});
					};
					conn.sendAsync();													
				}
			}, 
			function(){hideLightBox();return false;}, 
			null, 
			true, true);		
	}
})
