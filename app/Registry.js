/*
 * Registry is a state synchronizer between remote and this instance
 * Manages Extensions
 * implements : "ReactiveProvider"
 */

Class.create("Registry", {

  //saved Application state of User activity?
  _registry : {'type' : 'registry'},
  _extensions : {},
  //Main actions
  //_registry.actions : require(ROOT_PATH + '/config/actions.json'),
  //_registry.user : {},

  /*
   * Establish websocket connection
   */
  initialize : function(url, app){
    var self = this;
    if (isServer){
      this._socket = require('sockjs').createServer();
      this._socket.installHandlers(app, {prefix: url});

      //Send registry on connection established
      this._socket.on('connection', function(conn) {
        conn.write(JSON.stringify(self._registry))
        conn.on('data', function(message) {
          //TODO process registry part
          conn.write(message);
        });
      });
    }else{
      var socket = this._socket = new SockJS(url);
      socket.onopen = function() {};
      socket.onmessage = this._onMessage.bind(this);
      //socket.onclose   = this._onClose
    }
  },

  get : function(user){
    //TODO add User on auth
    _registry.user.preferences = User.getPreferences();

    var repositories = User.getRepositories();

    //TODO
    //Extract names and load providers
    var names = [];
    repositories.each(function(repo){
      names.push(_registry.user.repositories);
    })
    //_registry.user.repositories = ;

    this._loadExtensions(names);
    _registry.extensions = _extensions;

    return _registry;
  },

  _onMessage : function(e){
    this._registry = JSON.parse(e.data)
  },

  /*
   * @return Array
   */
  _loadExtensions : function(names){
    names.forEach(function(name){
      this._extensions[name] = (Extension.load(name));
    })
  },
  /**
   * Inserts a document fragment retrieved from server inside the full tree.
   * The item must contains the xPath attribute to locate it inside the registry.
   * Event app:registry_part_loaded is triggerd once this is done.
   * @param documentElement DOMItem
   */
  refreshXmlRegistryPart : function(documentElement){
    var xPath = documentElement.getAttribute("xPath");
    var existingItem = XPathSelectSingleItem(this._registry, xPath);
    if(existingItem && existingItem.parentItem){
      var parentItem = existingItem.parentItem;
      parentItem.removeChild(existingItem);
      if(documentElement.firstChild){
        parentItem.appendChild(documentElement.firstChild.cloneItem(true));
      }
    }else if(xPath.indexOf("/") > -1){
      // try selecting parentItem
      var parentPath = xPath.substring(0, xPath.lastIndexOf("/"));
      var parentItem = XPathSelectSingleItem(this._registry, parentPath);
      if(parentItem && documentElement.firstChild){
        //parentItem.ownerDocument.importItem(documentElement.firstChild);
        parentItem.appendChild(documentElement.firstChild.cloneItem(true));
      }     
    }else{
      if(documentElement.firstChild) this._registry.appendChild(documentElement.firstChild.cloneItem(true));
    }
    document.fire("app:registry_part_loaded", xPath);   
  }

})
