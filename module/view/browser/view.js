Class.create("ViewBrowserOpener", View, {

	initialize : function($super, oFormObject){},
	
	open : function($super, userSelection){
        var fileName =  app.getUserSelection().getUniqueFileName();
        var node = app.getUserSelection().getUniqueNode();
        if(node.getMime() == "url"){
        	this.openURL(fileName);
        	return;
        } 
        var repo = app.user.getActiveRepository();
        var loc = document.location.href;
        if(loc.indexOf("?") !== -1) loc = loc.substring(0, loc.indexOf("?"));
        var url = loc.substring(0, loc.lastIndexOf('/'));
        var nonSecureAccessPath = serverAccessPath.substring(0, serverAccessPath.lastIndexOf('?'));
        var open_file_url = url + "/" + nonSecureAccessPath + "?get_action=open_file&repository_id=" + repo + "&file=" + encodeURIComponent(fileName);
        myRef = window.open(open_file_url);
        if(!Modernizr.boxshadow){
            window.setTimeout('hideLightBox()', 1500);
        }else{
            hideLightBox();
        }
	},
	
	openURL : function(fileName){
		var connection = new Connection();
		connection.addParameter('get_action', 'get_content');
		connection.addParameter('file', fileName);	
		connection.onComplete = function(transp){
			var url = transp.responseText;
	        myRef = window.open(url, "Graph Bookmark", "location=yes,menubar=yes,resizable=yes,scrollbars=yea,toolbar=yes,status=yes");
	        hideLightBox();
		}.bind(this);
		connection.sendSync();		
	}
});
