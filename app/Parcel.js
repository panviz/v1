/**
 * Data surveyor
 * Is responsible for access restrictions
 * Secure Data delivery from/to Proxy
 * specify data format {model, name, content}
 */
Class.create("Parcel", {

  /**
   * Parcel can be initialized empty or with sender's Connection
   * @param obj Connection
   */
  initialize : function(connection){
    // put or get
    this.action = "";

    // name of Reactive class on Client & Server
    this.model = "";

    // record identifier (id or name)
    this.name = "";

    // unique parcel identifier
    this.id = "";

    // Connection object which can send this parcel
    this.conn = null;

    // Parcel content
    this.content = null;

    // Error is provided if content missing
    this.error = null;

    this.options = {};

    // id of user which requested this parcel
    this.sender = "";

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

    if (connection){
      this.conn = connection;
      this.sender = this.conn.id;  //set sender explicit
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
    Object.extend(this.options, msg.options);
    // check sender write access
    if (isServer && this.action == 'put') return this._secureFor(cb);
    cb();
  },

  /**
   * @param recipient String UserID - optional
   * @param connection Connection of recipient - optional
   */
  send : function(recipient, connection){
    // Parcel will be sent to specified recipient
    // or back to its sender, specified on its creation
    connection = connection || this.conn
    var self = this;
    if (this.model && this.name){
      //TODO add secure check on Client?

      var secureSend = function(restrictedContent){
        var message = JSON.stringify({
          action: self.action,
          model: self.model,
          name: self.name,
          error: self.error,
          content: restrictedContent,
          options: self.options,
          sender: self.sender
        });
        if (isServer){
          connection.write(message);
        } else {
          connection.send(message);
        }
      }

      // check recipient read access
      if (isServer){
        self._secureFor(secureSend, recipient);
      } else {
        secureSend(this.content);
      }
    } else{
      throw("Parcel should have model, name specified")
    }
  },

  /** @server
   * Restrict incoming message accordingly to sender's write access rights
   * Restrict outgoing message accordingly to recipient's read access rights
   * @param addressee 'sender' or recipient id
   * @param send Function callback
   */
  _secureFor : function(send, addressee){
    var self = this;
    // no content to restrict
    if (!this.content) return send();
    var key = 'session'
    var value = addressee || this.sender
    // TODO find by name provided with put request?

    // find addresse by token
    if (this.options.SECURE_TOKEN){
      key = 'token'
      value = this.options.SECURE_TOKEN
    }
    // find by session ID
    else if (Object.isString(addressee)){
      key =  'session'
    }
    // find by user ID
    else if (Object.isNumber(addressee)){
      key =  'id'
    }

    var onFind = function(user){
      send(self._restrict(user));
    }
    $user.store.find(onFind, 'user', key, value)
  },

  /**
   * restrict content accordingly to found user access rights
   * @param user User
   * @returns Json Restricted content
   */
  _restrict : function(user){
    if (user){
      // No restrictions for admin
      if (user.roles && user.roles.include('admin')) return this.content;
      // No restrictions for owner
      if (this.content.owner == user.id) return this.content
      // No restrictions for just logged user asking itself
      if (this.content.session == user.session) return this.content
      // No restrictions for sending user its content
      if (this.name == user.id) return this.content
      //TODO Process other roles
      //TODO Process content shared options
    }
    
    // restrict to Public for anonymous user
    var restrictedContent = {};
    var manager = $app.getManager(this.model);
    if (manager.public == "all") return this.content;

    var self = this;
    manager.public.map(function(key){
      restrictedContent[key] = self.content[key];
    })
    return restrictedContent;
  }
})
