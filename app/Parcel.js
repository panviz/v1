/*
 * Data - object format to send {model, name, content}
 */
Class.create("Parcel", {

  // put or get
  action: "",

  // name of Reactive class on Client & Server
  model : "",

  // unique record identifier
  name : "",

  // unique parcel identifier
  id : "",

  // Connection object which can send this parcel
  conn : {},

  // Parcel content
  content : {},

  /*
   * Parcel can be initialized empty or with Connection or message content or both
   */
  initialize : function(obj, msg){
    if (obj.send || obj.write){
      this.conn = obj;
      if (msg) this.recieve(msg);
    } else {
      this.recieve(obj);
    }
    this.__defineGetter__("id", function() {return this.model + this.name})
    this.__defineSetter__("addressee", function(user) {this.options.addressee = user})
    this.__defineGetter__("addressee", function(user) {return this.options.addressee})
  },

  /*
   * Parse message
   */
  recieve : function(message){
    var msg = Object.isString(message) ? JSON.parse(message) : message;
    this.action = msg.action || "get";
    this.model = msg.model;
    this.name = msg.name;
    this.content = msg.content || {};
    this.options = msg.options || {};
  },

  /*
   * Send parcel depending on Proxy location
   */
  send : function(){
    if (this.model && this.name){
      var message = JSON.stringify({
        action: this.action,
        model: this.model,
        name: this.name,
        content: this.content,
        options: this.options
      });
      if (isServer){
        this.conn.write(message);
      } else {
        this.conn.send(message);
      }
    } else{
      throw("Message should have model & name specified")
    }
  }
})
