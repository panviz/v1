/*
 * Description : base for nodes provider
 */
Interface.create("INodeProvider", {
	initProvider : function(properties){},
	loadNode : function(nodePath, nodeCallback, childCallback){}
});
