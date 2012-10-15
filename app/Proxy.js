/**
 * Reactive Proxy on WebSocket
 * Implements instant messaging between this and remote instances
 * ! Do not split into server and client
 * Try to keep methods universal for any app instance using this Proxy
 */
Class.create("Proxy", {

  //TODO replace saving callback with message dispatcher
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

  /** @client
   * Makes remote call of given model
   * Save callback to trigger it on same data update
   * @param model String name of the Model
   * @param name record identifier to pass Model.get on remote side
   * @param cb Function callback
   */
  send : function(action, model, name, options){
    var request = new Parcel(this._socket);
    request.action = action;
    request.model = model;
    request.name = name;
    if (options){
      request.options = options;
      request.content = options.content;
    }
    request.send();
  },

  /** @client
   * Client message is always PUT
   * @param e String stringified object
   */
  _onMessage : function(data){
    // Model requests its data
    if (data.id){
      if (data.error) return $modal.error(data.error);
      if (data.content){
        var newId = data.content.id
        var recipient = $app.man[data.model] || $app.getItem(data.name, newId)
        recipient.onLoad(data.content)
      }
    }
    // Other messages
  },

  /** @server
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
        data.send();
      }
    } else {
      // Proceed with other message types
    }
  },

  /** @server
   * Send Parcel to sender
   * Save sender to send him updates later if record exists
   * @param data Parcel (empty) to be sent to user
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
    followers[data.id].set(data.sender, data.conn);
  },

  /** @server
   * @param data Parcel
   * @param diff Json content to send
   * Subscribe updater and sent Parcel to all followers
   */
  broadcast : function(data, diff){
    this.subscribe(data, diff);
    var sender  = data.sender;

    if (diff){
      var followers = this._subscribers[data.id];
      followers.keys().forEach(function(followerId){
        // Skip sender
        if (followerId == sender) return;
        var recipientConnection = followers.get(followerId);
        data.send(followerId, recipientConnection);
      })
    }
  }
})
