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
		if(!transport.responseJSON || !transport.responseJSON.item) return;
		var root = transport.responseJSON.item;
		var children = root.collection;
		var contextItem = new Item(root.path, {"metadata": root.params});
		
		origItem.replaceBy(contextItem);
		
		if(root.error){
			origItem.notify("error", root.error + '(Source:'+origItem.getPath()+')');
		}			
		
		if(root.pagination){
			var paginationData = new Hash(root.pagination);
			origItem.getMetadata().set('paginationData', paginationData);
		}else if(origItem.getMetadata().get('paginationData')){
			//remove pagination on last page recieved
			origItem.getMetadata().unset('paginationData');
		}

		// CHECK FOR COMPONENT CONFIGS CONTEXTUAL DATA
		//var configs = XPathSelectSingleItem(root, "client_configs");
		//if(configs){
			//origItem.getMetadata().set('client_configs', configs);
		//}		

		children.each(function(child){
			var item = new Item(child.path, {"metadata": child.params});
			origItem.addChild(item);
			if(childCallback){
				childCallback(item);
			}
		}.bind(this) );

		if(itemCallback){
			itemCallback(origItem);
		}
	}
});
