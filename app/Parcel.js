/*
 * Secure Data - object format to send {model, name, content}
 * Is responsible for access restrictions
 */
Class.create("Parcel", {

  // put or get
  action: "",

  // name of Reactive class on Client & Server
  model: "",

  // unique record identifier
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
  recipient: "",

  /*
   * Parcel can be initialized empty or with Connection or message content or both
   */
  initialize : function(obj, msg){
    this.__defineGetter__("id", function(){
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

  /*
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

  /*
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
   * Restrict incoming or outgoing message for sender or recipient respectively 
   * @param direction of Parcel delivery
   */
  _secureFor : function(addressee){
    if (!this.content) return
    if (addressee == 'sender'){
      var key = this.options.SECURE_TOKEN || this.sender;
      var type = this.options.SECURE_TOKEN ? 'token' : 'name'
    } else{
      var key = this.recipient;
      var type = Object.isString(this.recipient) ? 'name' : 'id'
    }
    var onFind = function(user){
      this[addressee] = user.id;
      this._restrict(addressee);
    }
    try{
      $user.store.find(onFind.bind(this), key, type)
    }
    catch(e){this._restrict(addressee)};
  },

  /*
   * restrict content due to found user access rights
   */
  _restrict : function(addressee){
    var user = this[addressee];
    if (user.name){
      //No restrictions for admin and owner
      if (user.roles.include('admin') || this.content.owner == user.id) return;
      //TODO Process other roles
    }
    if (addressee == 'recipient' && this.content.owner == this.recipient) return;
    
    // restrict to Public for anonymous user
    var result = {};
    //TODO create $app.getManager()
    var manager = $app[this.model];
    if (manager.public == "all") return
    var self = this;
    manager.public.map(function(key){
      result.key = self.content.key;
    })
    this.content = result;
  }
})
