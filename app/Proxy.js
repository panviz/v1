/**
 * Reactive Proxy on WebSocket
 * Implements instant messaging between this and remote instances
 * ! Do not split into server and client
 * Try to keep methods universal for any app instance using this Proxy
 */
Class.create("Proxy", {

  // Client has one callback per dataId
  _cbs : {},

  //TODO persist followers
  //@server Server has many clients for one dataId
  _subscribers : {},

  /**
   * Start websocket messaging
   */
  initialize : function(url){
    var self = this;

    if (isServer){
      this._socket = require('sockjs').createServer();
      this._socket.installHandlers($app.server, {prefix: url});

      //Send registry on connection established
      this._socket.on('connection', function(conn){
        conn.on('data', function(message){
          self._makeParcel(conn, message);
        })
      });
    }else{
      var socket = this._socket = new SockJS(url);
      socket.onopen = function() {
        document.fire("proxy:connected");
      };
      socket.onmessage = this._makeParcel.bind(this);
      socket.onclose   = function(){
        document.fire("proxy:disconnected");
      }
    }
  },

  _makeParcel : function(obj, msg){
    var self = this;
    var conn;
    if (obj.write){
      conn = obj;
    } else {
      msg = obj.data;
    }
    var data = new Parcel(conn);
    var cb = function(){
      if (isServer) {
        self._onServer(data);
      } else{
        self._onMessage(data);
      }
    }
    data.parse(msg, cb);
  },

  /* @client
   * Makes remote call of given model
   * Save callback to trigger it on same data update
   * @param model String name of the Model
   * @param name record identifier to pass Model.get on remote side
   * @param cb Function callback
   */
  send : function(cb, action, model, name, options){
    var request = new Parcel(this._socket);
    request.action = action;
    request.model = model;
    request.name = name;
    if (options){
      request.options = options;
      request.content = options.content;
    }
    request.send();

    //TODO use connection callID
    this._cbs[request.id] = cb;
  },

  /* @client
   * Client message is always PUT
   * @param e String stringified object
   */
  _onMessage : function(data){
    // Model requests its data
    if (data.id){
      if (data.content) this._cbs[data.id](data.content);

      // On Error Remove update model callback
      if (data.error){
        this._cbs[data.id](data.error);

        // on NotFound error leave callback for future updates
        if (data.error != "Not Found") this._cbs[data.id] = undefined;
      }
    }
    // Other messages
  },

  /* @server
   * @param data Parcel
   */
  _onServer : function(data){
    var self = this;
    if (data.action){
      var manager = $app.getManager(data.model);

      if (manager){
        if (data.action == "get"){
          var onFind = function(diff, err){
            if (err){
              if (err != "Not Found") throw(err);
              data.error = err;
              self.subscribe(data);
            } else {
              self.subscribe(data, diff)
            }
          }
          manager.get(onFind, data.name, data.options);
        }
        else if (data.action = "put"){
          var onFind = function(diff, err){
            if (err){
              if (err != "Not Found") throw(err);
              data.error = err;
              self.subscribe(data);
            } else {
              self.broadcast(data, diff)
            }
          }
          manager.put(onFind, data.name, data.content, data.options);
        }
      } else {
        data.error = "Model not supported";
        data.send(data);
      }
    } else {
      // Proceed with other message types
    }
  },

  /* @server
   * Send Parcel to recipient
   * Save recipient to send him updates later if record exists
   * @param data empty Parcel to be sent to user
   * @param diff Json Content diff to send
   */
  subscribe : function(data, diff){
    data.content = diff;
    data.send();

    // set follower after Parcel has been sent
    var followers = this._subscribers;
    if (!followers[data.id]) followers[data.id] = $H();
    // TODO don't save data.conn
    // retrieve users connection from user.session
    followers[data.id].set(data.recipient, data.conn);
  },

  /* @server
   * Subscribe updater and sent Parcel to all followers
   */
  broadcast : function(data, diff){
    this.subscribe(data, diff);
    var sender  = data.recipient;

    if (diff){
      data.content = diff;
      var followers = this._subscribers[data.id];
      followers.keys().forEach(function(followerId){
        // Skip sender
        if (followerId == sender) return;
        data.recipient = followerId;
        data.conn = followers.get(followerId);
        data.send();
      })
    }
  }
})
