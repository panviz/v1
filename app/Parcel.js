/**
 * Secure Data - object format to send {model, name, content}
 * Is responsible for access restrictions
 */
Class.create("Parcel", {

  // put or get
  action: "",

  // name of Reactive class on Client & Server
  model: "",

  // record identifier
  name: "",

  // unique parcel identifier
  id: "",

  // Connection object which can send this parcel
  conn: null,

  // Parcel content
  content: null,

  // Error is provided if content missing
  error: null,

  options: {},

  // id of user which requested this parcel
  sender: "",

  // id of user whom to send this parcel
  // String -> sessionID or Number -> userID
  recipient: "",

  /**
   * Parcel can be initialized empty or with Connection
   * @param obj connection
   */
  initialize : function(connection){
    this.__defineGetter__("id", function(){
      // TODO add options to id as name is not uniq
      return this.model + this.name;
    })
    this.__defineSetter__("sender", function(userId){
      this.options.sender = userId;
    })
    this.__defineGetter__("sender", function(){
      return this.options.sender || this.conn.id;
    })
    this.__defineSetter__("recipient", function(id){
      this.options.recipient = id;
    })

    // Send parcel back if no recipient specified
    this.__defineGetter__("recipient", function(){
      return this.options.recipient || this.sender;
    })
    if (connection){
      this.conn = connection;
      this.recipient = this.conn.id;  //set recipient explicit
    }
  },

  /**
   * Parse message
   */
  parse : function(message, cb){
    var msg = Object.isString(message) ? JSON.parse(message) : message;
    this.action = msg.action || "get";
    this.model = msg.model;
    this.name = msg.name;
    this.error = msg.error;
    this.content = msg.content;
    this.options = Object.extend(this.options, msg.options);
    // check sender write access
    if (isServer && this.action == 'put') return this._secureFor('sender', cb);
    cb();
  },

  /**
   * Send parcel depending on its current location
   */
  send : function(){
    var self = this;
    if (this.model && this.name){
      //TODO add secure check on Client?

      var secureSend = function(){
        var message = JSON.stringify({
          action: self.action,
          model: self.model,
          name: self.name,
          error: self.error,
          content: self.content,
          options: self.options,
          sender: self.sender
        });
        if (isServer){
          self.conn.write(message);
        } else {
          self.conn.send(message);
        }
      }

      // check recipient read access
      if (isServer){
        self._secureFor("recipient", secureSend);
      } else {
        secureSend();
      }
    } else{
      throw("Parcel should have model, name specified")
    }
  },

  /* @server
   * Restrict incoming message accordingly to sender's write access rights
   * Restrict outgoing message accordingly to recipient's read access rights
   * @param addressee of Parcel delivery
   */
  _secureFor : function(addressee, cb){
    var self = this;
    // no content to restrict
    if (!this.content) return cb();
    // find sender by token or name provided with put request
    if (addressee == 'sender'){
      var key = this.options.SECURE_TOKEN || this.sender;
      var type = this.options.SECURE_TOKEN ? 'token' : 'name'
    } else{
      // find recipient by session or id
      var key = this.recipient;
      var type = Object.isString(this.recipient) ? 'session' : 'id'
    }

    var onFind = function(user){
      if (user){
        self[addressee] = user.id;
        self._restrict(user);
      } else{
        self._restrict();
      }
      cb();
    }
    $user.store.find(onFind, 'user', type, key)
  },

  /**
   * restrict content accordingly to found user access rights
   * @param user User
   */
  _restrict : function(user){
    if (user){
      // No restrictions for admin
      if (user.roles.include('admin')) return;
      // No restrictions for owner
      if (this.content.owner == user.id) return;
      // No restrictions for just logged user asking itself
      if (this.content.session == user.session) return;
      //TODO Process other roles
      //TODO Process content shared options
    }
    
    // restrict to Public for anonymous user
    var result = {};
    var manager = $app.getManager(this.model);
    if (manager.public == "all") return;
    var self = this;
    manager.public.map(function(key){
      result.key = self.content.key;
    })
    this.content = result;
  }
})
