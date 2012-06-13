/*
 * Description : base for nodes provider
 */
Interface.create("IAjxpNodeProvider", {
	initProvider : function(properties){},
	loadNode : function(nodePath, nodeCallback, childCallback){}
});
