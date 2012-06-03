Class.create("BrowserOpener", View, {

	initialize : function($super, oFormObject){},
	
	open : function($super, userSelection){
        var fileName =  ajaxplorer.getUserSelection().getUniqueFileName();
        var node = ajaxplorer.getUserSelection().getUniqueNode();
        if(node.getAjxpMime() == "url"){
        	this.openURL(fileName);
        	return;
        } 
        var repo = ajaxplorer.user.getActiveRepository();
        var loc = document.location.href;
        if(loc.indexOf("?") !== -1) loc = loc.substring(0, loc.indexOf("?"));
        var url = loc.substring(0, loc.lastIndexOf('/'));
        var nonSecureAccessPath = ajxpServerAccessPath.substring(0, ajxpServerAccessPath.lastIndexOf('?'));
        var open_file_url = url + "/" + nonSecureAccessPath + "?get_action=open_file&repository_id=" + repo + "&file=" + encodeURIComponent(fileName);
        myRef = window.open(open_file_url);
        if(!Modernizr.boxshadow){
            window.setTimeout('hideLightBox()', 1500);
        }else{
            hideLightBox();
        }
	},
	
	openURL : function(fileName){
		var connexion = new Connexion();
		connexion.addParameter('get_action', 'get_content');
		connexion.addParameter('file', fileName);	
		connexion.onComplete = function(transp){
			var url = transp.responseText;
	        myRef = window.open(url, "AjaXplorer Bookmark", "location=yes,menubar=yes,resizable=yes,scrollbars=yea,toolbar=yes,status=yes");
	        hideLightBox();
		}.bind(this);
		connexion.sendSync();		
	}
});
