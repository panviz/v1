/*
 * Description : base for items provider
 */
Interface.create("IItemProvider", {
	initProvider : function(properties){},
	loadItem : function(itemPath, itemCallback, childCallback){}
});
