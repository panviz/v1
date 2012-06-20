/**
 * Implementation of the IItemProvider interface based on a remote server access.
 * Default for all repositories.
 */
Class.create("RemoteItemProvider", {
	__implements : "IItemProvider",
	/**
	 * Constructor
	 */
	initialize : function(){
		
	},
	/**
	 * Initialize properties
	 * @param properties Object
	 */
	initProvider : function(properties){
		this.properties = properties;
	},
	/**
	 * Load an item
	 * @param item Item
	 * @param itemCallback Function On item loaded
	 * @param childCallback Function On child added
	 */
	loadItem : function(item, itemCallback, childCallback){
		var path = item.getPath();
		//TODO REST actions for loading items
		// "/data/" for ls action
		var connection = new Connection('/data' + path);
		//load current page
		if(item.getMetadata().get("paginationData")){
			path += "%23" + item.getMetadata().get("paginationData").get("current");
		}
		if(this.properties){
			$H(this.properties).each(function(pair){
				connection.addParameter(pair.key, pair.value);
			});
		}
		connection.onComplete = function (transport){
			try{				
				debugger
				this.parseItems(item, transport, itemCallback, childCallback);
			}catch(e){
				if(app) app.displayMessage('ERROR', 'Loading error:'+e.message);
				else alert('Loading error:'+ e.message);
			}
		}.bind(this);	
		connection.sendAsync();
	},
	/**
	 * Parse the answer and create Items
	 * @param origItem Item
	 * @param transport Ajax.Response
	 * @param itemCallback Function
	 * @param childCallback Function
	 */
	parseItems : function(origItem, transport, itemCallback, childCallback){
		if(!transport.responseJSON || !transport.responseJSON.collection) return;
		var rootItem = transport.responseJSON.collection;
		var children = rootItem.collection;
		var contextItem = new Item(rootItem.params);
		
		origItem.replaceBy(contextItem);
		
		// CHECK FOR MESSAGE OR ERRORS
		var errorItem = XPathSelectSingleItem(rootItem, "error|message");
		if(errorItem){
			if(errorItem.itemName == "message") type = errorItem.getAttribute('type');
			if(type == "ERROR"){
				origItem.notify("error", errorItem.firstChild.itemValue + '(Source:'+origItem.getPath()+')');				
			}			
		}
		
		// CHECK FOR PAGINATION DATA
		var paginationItem = XPathSelectSingleItem(rootItem, "pagination");
		if(paginationItem){
			var paginationData = new Hash();
			$A(paginationItem.attributes).each(function(att){
				paginationData.set(att.itemName, att.itemValue);
			}.bind(this));
			origItem.getMetadata().set('paginationData', paginationData);
		}else if(origItem.getMetadata().get('paginationData')){
			origItem.getMetadata().unset('paginationData');
		}

		// CHECK FOR COMPONENT CONFIGS CONTEXTUAL DATA
		var configs = XPathSelectSingleItem(rootItem, "client_configs");
		if(configs){
			origItem.getMetadata().set('client_configs', configs);
		}		

		// NOW PARSE CHILDREN
		var children = XPathSelectItems(rootItem, "tree");
		children.each(function(childItem){
			var child = new Item(childItem);
			origItem.addChild(child);
			if(childCallback){
				childCallback(child);
			}
		}.bind(this) );

		if(itemCallback){
			itemCallback(origItem);
		}
	}
});
