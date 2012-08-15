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
   * Parcel can be initialized empty or with Connection or message content or both
    // @param obj logged user or connection
   */
  initialize : function(obj, msg){
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
      return this.options.recipient = id;
    })

    // Send parcel back if no recipient specified
    this.__defineGetter__("recipient", function(){
      return this.options.recipient || this.sender;
    })
    if (obj.send || obj.write){
      this.conn = obj;
      if (msg) this.parse(msg);
      this.recipient = this.conn.id;  //set recipient explicit
    } else {
      this.parse(obj);
    }
  },

  /**
   * Parse message
   */
  parse : function(message){
    var msg = Object.isString(message) ? JSON.parse(message) : message;
    this.action = msg.action || "get";
    this.model = msg.model;
    this.name = msg.name;
    this.error = msg.error;
    this.content = msg.content;
    this.options = msg.options || this.options;
    // check sender write access
    if (isServer){
      if (this.action == 'put') this._secureFor('sender');
    }
  },

  /**
   * Send parcel depending on its current location
   */
  send : function(){
    if (this.model && this.name){
      //TODO add secure check on Client?

      // check recipient read access
      if (isServer) this._secureFor("recipient");
      var message = JSON.stringify({
        action: this.action,
        model: this.model,
        name: this.name,
        error: this.error,
        content: this.content,
        options: this.options,
        sender: this.sender
      });
      if (isServer){
        this.conn.write(message);
      } else {
        this.conn.send(message);
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
  _secureFor : function(addressee){
    if (!this.content) return
    if (addressee == 'sender'){
      var key = this.options.SECURE_TOKEN || this.sender;
      var type = this.options.SECURE_TOKEN ? 'token' : 'name'
    } else{
      var key = this.recipient;
      var type = Object.isString(this.recipient) ? 'session' : 'id'
    }
    var onFind = function(user){
      this[addressee] = user.id;
      this._restrict(user);
    }
    try{
      $user.store.find(onFind.bind(this), key, type)
    }
    catch(e){this._restrict()};
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
      if (this.content.session == user.session) return
      //TODO Process other roles
      //TODO Process content shared options
    }
    
    // restrict to Public for anonymous user
    var result = {};
    var manager = $app.getManager(this.model);
    if (manager.public == "all") return
    var self = this;
    manager.public.map(function(key){
      result.key = self.content.key;
    })
    this.content = result;
  }
})
