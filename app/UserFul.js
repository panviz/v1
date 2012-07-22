/**
 * User management
 */
Class.create("UserFul", Reactive, {
  public : ["id", "name", "loggedIn"],

  initialize : function($super){
    $super();
  },

  /* @server
   * Authentication
   */
  put : function($super, cb, name, content, options){
    if (isServer){
      var password = options.password
      if (password){
        var onFind = function(user){
          debugger
          if (user && user.password == password){
            user.loggedIn = true;
            user.lastLogin = (new Date).toJSON();

            //TODO generate token
            user.SECURE_TOKEN = "asdf";
            
            // Set user connection id to pass security check on sending reply
            user.owner = options.recipient;

            // Reply with full user data
            var onSave = function(){
              cb(user);
            }
            // Save logged user on right password
            $super(onSave, name, user, options);
          } else{
            // wrong password
            throw("Not Found");
          }
        }
        // If password specified - Find user by login name to check password
        this.get(onFind, name, options);
      } else{
        // Update user with content
        $super(cb, name, content, options)
      }
    } else{
      // Update user with content on Client
      $super(cb, name, content, options)
    }
  },

  setCurrentUser : function(){
  }
})
