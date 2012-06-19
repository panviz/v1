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
	 * Load a item
	 * @param item Item
	 * @param itemCallback Function On item loaded
	 * @param childCallback Function On child added
	 */
	loadItem : function(item, itemCallback, childCallback){
		var conn = new Connection();
		conn.addParameter("get_action", "ls");
		conn.addParameter("options", "al");
		var path = item.getPath();
		// Double encode # character
		if(item.getMetadata().get("paginationData")){
			path += "%23" + item.getMetadata().get("paginationData").get("current");
		}
		conn.addParameter("dir", path);
		if(this.properties){
			$H(this.properties).each(function(pair){
				conn.addParameter(pair.key, pair.value);
			});
		}
		conn.onComplete = function (transport){
			try{				
				this.parseItems(item, transport, itemCallback, childCallback);
			}catch(e){
				if(app) app.displayMessage('ERROR', 'Loading error:'+e.message);
				else alert('Loading error:'+ e.message);
			}
		}.bind(this);	
		conn.sendAsync();
	},
	/**
	 * Parse the answer and create Items
	 * @param origItem Item
	 * @param transport Ajax.Response
	 * @param itemCallback Function
	 * @param childCallback Function
	 */
	parseItems : function(origItem, transport, itemCallback, childCallback){
		if(!transport.responseXML || !transport.responseXML.documentElement) return;
		var rootItem = transport.responseXML.documentElement;
		var children = rootItem.childItems;
		var contextItem = this.parseItem(rootItem);
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
			var child = this.parseItem(childItem);
			origItem.addChild(child);
			if(childCallback){
				childCallback(child);
			}
		}.bind(this) );

		if(itemCallback){
			itemCallback(origItem);
		}
	},
	/**
	 * Parses XML Item and create Item
	 * @param xmlItem XMLItem
	 * @returns Item
	 */
	parseItem : function(xmlItem){
		var item = new Item(
			xmlItem.getAttribute('filename'), 
			(xmlItem.getAttribute('is_file') == "1" || xmlItem.getAttribute('is_file') == "true"), 
			xmlItem.getAttribute('text'),
			xmlItem.getAttribute('icon'));
		var reserved = ['filename', 'is_file', 'text', 'icon'];
		var metadata = new Hash();
		for(var i=0;i<xmlItem.attributes.length;i++)
		{
			metadata.set(xmlItem.attributes[i].itemName, xmlItem.attributes[i].itemValue);
			if(Prototype.Browser.IE && xmlItem.attributes[i].itemName == "ID"){
				metadata.set("ajxp_sql_"+xmlItem.attributes[i].itemName, xmlItem.attributes[i].itemValue);
			}
		}
		// BACKWARD COMPATIBILIY
		//metadata.set("XML_NODE", xmlItem);
		item.setMetadata(metadata);
		return item;
	}
});
