/**
 * User management
 */
Class.create("UserFul", Provider, {
  public : ["id", "name", "loggedIn"],

  initialize : function($super, store){
    $super(store);
    this.store.setUniq(["name", "SECRET_TOKEN", "session"]);
  },

  /* @server
   * Authentication
   */
  put : function($super, cb, name, content, options){
    if (isServer){
      var password = options.password
      if (!content && password){
        this.login(cb, name, options);
      } else{
        // Update user with content
        $super(cb, name, content, options)
      }
    } else{
      // Update user with content on Client
      $super(cb, name, content, options)
    }
  },

  login : function(cb, name, options){
    var self = this;
    var onFind = function(user){
      if (user && user.password == options.password){
        user.loggedIn = true;
        user.lastLogin = (new Date).toJSON();

        //TODO generate token
        user.SECURE_TOKEN = "asdf";
        
        // Set user connection id to pass security check on sending reply
        user.session = options.recipient;

        // Reply with full user data
        var onSave = function(){
          cb(user);
        }
        // Save logged user on right password
        self.put(onSave, name, user, options);
      } else{
        // wrong password
        throw("Not Found");
      }
    }
    // If password specified - Find user by login name to check password
    this.get(onFind, name, options);
  },

  logout : function(){
  },

  setCurrentUser : function(){
  }
})
