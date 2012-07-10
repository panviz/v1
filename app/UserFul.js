/*
 * DB mapping, Authentication, and management of Repositories and preferences
 */

Class.create("UserFul", {

  //TODO Move user's data to database
  users : require(ROOT_PATH + '/data/users.json'),

  initialize : function(){
    //TODO log User here
    //if(this._registry.user){
      //this.user = new User(this._registry.user);
      //document.fire("app:user_logged", this.user);
    //}else{
      //this.logUserFromCookie();
    //}
  },
  
  getPreferences : function(){
    return _settings.preferences;
  },

  getRepositories : function(){
    return _settings.repositories;
  },

  findById : function(id, fn){
    var idx = id - 1;
    if (this.users[idx]) {
      fn(null, this.users[idx]);
    } else {
      fn(new Error('User ' + id + ' does not exist'));
    }
  },
  findByName : function(username, fn){
    for (var i = 0, len = this.users.length; i < len; i++) {
      var user = this.users[i];
      if (user.username === username) {
        return fn(null, user);
      }
    }
    return fn(null, null);
  }
})
