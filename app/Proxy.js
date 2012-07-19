/*
 * ReactiveProvider
 * Implements instant messaging between this and remote instances
 */
Class.create("Proxy", {

  // Client has one callback per dataId
  _cbs : {},

  //@server Server has many clients for one dataId
  _subscribers : {},

  /*
   * Start websocket messaging
   */
  initialize : function(url){
    var self = this;

    if (isServer){
      this._socket = require('sockjs').createServer();
      this._socket.installHandlers($app.server, {prefix: url});

      //Send registry on connection established
      this._socket.on('connection', function(conn){
        //conn.write(JSON.stringify(this.p))
        conn.on('data', function(message){
          self._onServer(conn, message);
        })
      });
    }else{
      var socket = this._socket = new SockJS(url);
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
    var request = new Parcel(this._socket);
    request.model = model;
    request.name = name;
    //TODO use connection callID
    request.action = "get";
    request.options = options;
    request.send();

    this._cbs[request.id] = cb;
  },

  /*
   */
  put : function(model, name, options, cb){
  },

  /*
   * Client message is always PUT
   * @param model
   * @param e String stringified object
   */
  _onMessage : function(e){
                 debugger
    var data = new Parcel(e.data)

    // Model requests its data
    if (data.id){
      if (data.content) this._cbs[data.id](data.content);
      // On Error Remove update model callback
      if (data.error){
        this._cbs[data.id](data.error);
        // TODO on NotFound error leave callback for future updates
        this._cbs[data.id] = undefined;
      }
    }
    // Other messages
    if (data.registry) this._registry = data.registry;
  },

  /* @server
   * @param data Parcel
   */
  _onServer : function(conn, message){
    var data = new Parcel(conn);
    data.recieve(message);
                debugger
    var parseRequest = function(addressee){
      data.addressee = addressee;
      //TODO create $app.getManager()
      var manager = $app[data.model];

      if (manager){
        if (data.action == "get"){
          try{manager.get(data.name, data.options, this.send.bind(this, data))}
          catch(e){data.error = e; this.send(data)}
        }
        else if (data.action = "put"){
          var diff = manager.put(data.name, data.content, this.send.bind(this, data))
          this.broadcast(data, diff);
        }
      } else {
        data.error = "Model not supported";
        this.send(data);
      }
    }

    if (data.action){
      // Set addressee as logged user Id or connection Id
      if (data.content){
        $user.store.find(parseRequest.bind(this), data.content.SECURE_TOKEN, "token");
      } else {
        parseRequest.call(this, data.conn.id);
      }
    } else {
      // Proceed with other message types
    }
  },

  /* @server
   * Save addressee to send him updates later if record exists
   * @param conn Requester's connection
   * @param data Json reply to send to user
   * @param diff Json Content diff to send
   */
  send : function(data, diff){
            debugger
    if (diff){
      data.content = diff;
      var followers = this._subscribers[data.id] || {}
      followers[data.addressee] = data.conn;
    }
    data.send();
  },

  /* @server
   */
  broadcast : function(data, diff){
    if (diff){
      data.name = record.name;
      data.content = record
      this._subscribers[data.id].forEach(function(follower){
        // Skip Sender on data propagation
        if (data.addressee == follower.id) return;
        data.conn = subscriber.conn;
        data.send();
      })
    }
  }
})
