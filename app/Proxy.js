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
  initialize : function(p){
    this.url = p.socketPath;
    var self = this;

    if (isServer){
      this._socket = require('sockjs').createServer();
      this._socket.installHandlers($app.server, {prefix: this.url});

      //Send registry on connection established
      this._socket.on('connection', function(conn){
        //conn.write(JSON.stringify(this.p))
        conn.on('data', function(message){
          var data = new Parcel(conn);
          data.recieve(message);
          self._onServer(data);
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
      this._cbs[data.id](data.content)
      // On error Remove update model callback
      if (data.error) this._cbs[data.id] = undefined;
    }
    // Other messages
    if (data.registry) this._registry = data.registry;
  },

  /* @server
   * @param data Parcel
   * TODO check manager exists
   * TODO options should specify access level to information based on user role
   */
  _onServer : function(data){
                debugger
    var parseRequest = function(user){
      var manager = $app[data.model];
      data.addressee = user;

      if (data.action == "get"){
        manager.get(data.name, data.options, this.send.bind(this, data))
      }
      else if (data.action = "put"){
        var diff = manager.put(data.name, data.content, this.send.bind(this, data))
        this.broadcast(data, diff);
      }
    }

    if (data.action){
      $user.store.find(parseRequest.bind(this), data.content.SECURE_TOKEN, "token");
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
      followers[data.addressee.id] = data.conn;
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
        if (data.addressee.id == follower.id) return;
        data.conn = subscriber.conn;
        data.send();
      })
    }
  }
})
