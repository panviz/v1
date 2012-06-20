Class.create("UpDir", Action, {
	execute : function(){
		app.fireContextUp();
	}
})

Class.create("Refresh", Action, {
	execute : function(){
		app.fireContextRefresh();
	}
})

Class.create("ExtSelect", Action, {
	execute : function(){
		var userSelection = app.getUserSelection();
		if((userSelection.isUnique() && !userSelection.hasDir()))
		{
			var fileName = userSelection.getUniqueFileName();
			var selectorData = app.actionBar.selectorData;
			if(selectorData.get('type') == "ckeditor"){
				var ckData = selectorData.get('data');
				if (ckData['CKEditorFuncNum']) {
					var imagePath = fileName;
					if(ckData['relative_path']){
						imagePath = ckData['relative_path'] + fileName;
					}
					window.opener.CKEDITOR.tools.callFunction(ckData['CKEditorFuncNum'], imagePath);
					window.close();
				}
			}
		}
	}
})
