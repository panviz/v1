/**
 * User management
 */
Class.create("UserFul", Provider, {
  type: 'user',
  public: ["id", "name", "loggedIn"],

  initialize : function($super, store){
    $super(store);
    this.store.setUniq(["name", "SECRET_TOKEN"]);
  },

  /* @server
   * Authentication
   */
  put : function($super, cb, name, content, options){
    if (isServer){
      if (options && options.password){
        var password = options.password
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

  login : function(onLogin, name, options){
    var self = this;
    var onFind = function(user){
      if (user && user.password == options.password){
        var diff = {}
        diff.loggedIn = true;
        diff.lastLogin = (new Date).toJSON();

        //TODO generate token
        diff.token = "asdf";
        
        // Save user connection id as session to pass security check on sending reply
        diff.session = options.sender;

        var onSave = function(data){
          Object.extend(user, data)
          onLogin(user)
        }
        // Save logged user on right password
        self.put(onSave, user.id, diff)
      } else{
        // wrong password
        onLogin(null, "Not Found");
      }
    }
    // If password specified - Find user by login name to check password
    this.get(onFind, name, options);
  },

  register : function(){
  },

  logout : function(){
  },

  setCurrentUser : function(){
  }
})
