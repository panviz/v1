/*
 * Implements instant messaging between this and remote instances
 * implements : "ReactiveProvider"
 */
Class.create("Proxy", {

  // Client has one callback per datatype
  _cbs : {},

  //@server Server has many clients for one datatype
  _subscribers : {},

  /*
   * Start websocket messaging
   */
  initialize : function(p){
    this.url = p.socketPath;

    //TODO add User on auth
    //this._registry.user.preferences = User.getPreferences();

    //var repositories = User.getRepositories();

    ////TODO
    ////Extract names and load providers
    //var names = [];
    //repositories.each(function(repo){
      //names.push(_registry.user.repositories);
    //})
    ////_registry.user.repositories = ;

    //this._loadExtensions(names);
    var self = this;
    if (isServer){
      this._socket = require('sockjs').createServer();
      this._socket.installHandlers($app.server, {prefix: this.url});

      //Send registry on connection established
      this._socket.on('connection', function(conn){
        //conn.write(JSON.stringify(this.p))
        conn.on('data', function(message){
          self._onServer(conn, message)
        })
      });
    }else{
      var socket = this._socket = new SockJS(this.url);
      socket.onopen = function() {
        document.fire("proxy:connected");
      };
      socket.onmessage = this._onMessage.bind(this);
      socket.onclose   = function(){
        document.fire("proxy:disconnected");
      }
    }
  },

  /*
   * Makes remote call of given model
   * If item exists - return it (it is definitely up to date)
   * Else load it
   * Save callback to trigger it on same data update
   * @param model String name of the Model
   * @param id to pass Model.get on remote side
   * @param cb Function callback
   */
  get : function(model, name, options, cb){
          debugger
    var request = {model: model, name: name};
    //TODO use connection callID
    var datatype = model+name;
    request.get = true;
    request.options = options;
    this._socket.send(JSON.stringify(request));

    this._cbs[datatype] = cb;
  },

  /*
   * @param model
   * @param e String stringified object
   */
  _onMessage : function(e){
                 debugger
    var data = JSON.parse(e.data)

    // Model requests its data
    if (data.model){
      var datatype = data.model+data.name;
      this._cbs[datatype](data.data)
    }
    // Other messages
    if (data.registry) this._registry = data.registry;
  },

  /*
   * @server
   * TODO check manager exists
   * TODO options should specify access level to information based on user role
   */
  _onServer : function(conn, e){
                debugger
    var data = JSON.parse(e)
    var parseRequest = function(userData){
      userData = userData || {id: conn.id};
      var onGet = data.get ? this.reply : this.broadcast;
      var manager = $app[data.model];
      //TODO get access rights
      var options = {user: userData};
      manager.get(data.name, options, onGet.bind(this, conn, data, options))
    }
    if (data.get || data.put){
      $user.store.find(parseRequest.bind(this), data.SECURE_TOKEN, "token");
    } else {
      // Proceed with other message types
    }
  },

  // Save requester to send him updates later if record exists
  reply : function(conn, data, options, record){
            debugger
    if (record.name){
      data.data = record;
      var datatype = data.model+record.name;
      if (!this._subscribers[datatype]) this._subscribers[datatype] = [];
      this._subscribers[datatype].push(options.user.id);
    }
    conn.write(JSON.stringify(data));
  },

  broadcast : function(conn, data, options, record){
  }
})
