/*
 * Bookmarks actions
 */
Class.create("AddBookmark", Action, {
	execute : function(){
		document.fire("app:add_bookmark");
	}
})
