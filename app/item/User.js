/**
 * Authentication, and management of Repositories and preferences
 */
Class.create("User", Item, {
  type: 'user',

  /**
   */
  initialize : function($super, name, password){
    //avoid Reactive.get here
    $super(name);
    if (password){
      var p = {password: password, depth: 1};
      this.put(this._update.bind(this), name, null, p);
    }
  },

  _update : function($super, data){
    $super(data);
    this.p = $H(data.preferences);
    this.roles = data.roles || ['guest'];

    if (this.id) document.fire("user:updated");

    // Current user
    if (data.SECURE_TOKEN){
      this.p.set("SECURE_TOKEN", data.SECURE_TOKEN)
      $user = this;
      document.fire("user:auth");
      // restore last visited item as current root
      var current = data.context ? new Item(data.context) : this;
      document.fire("app:context_changed", current);
    }
  },

  isAdmin : function(){
    this._isAdmin = this._isAdmin !== undefined ? this._isAdmin : this.roles.include('admin');
    return result;
  },

  setRole : function(role){
    this.roles.push(role);
    if (role == "admin") this._isAdmin = true;
  },

  /**
   * Rights to read active item
   * @returns Boolean
   */
  readable : function(){
    return this._permissions.read;
  },
  
  /**
   * Rights to write active item
   * @returns Boolean
   */
  writable : function(){
    return this._permissions.write;
  },
  
  /**
   * Rights to copy active item
   * @returns Boolean
   */
  copiable : function(){
    return this._permissions.copiable;
  },
  
  /**
   * Get a user preference by its name
   * @returns Mixed
   */
  getPreference : function(prefName){
    return this._preferences.get(prefName); 
  },
  
  /**
   * Set a preference value
   * @param prefName String
   * @param prefValue Mixed
   * @param toJSON Boolean Whether to convert the value to JSON representation
   */
  setPreference : function(name, value){
    this._preferences.set(name, value);
  },

  /**
   * @param repoId String
   * @returns String
   */
  getSearchEngine : function(repoId){
    return this._repoSearchEngines.get(repoId);
  },

  savePreference : function(name){
    if(!this._preferences.get(name)) return;
    var connection = new Connection('/user/preferences');
        connection.setMethod('post');
    connection.addParameter("name_" + 0, name);
    connection.addParameter("value_" + 0, this._preferences.get(name));
    connection.sendAsync();
  },

  /**
   * Send all _preferences to the server. If oldPass, newPass and seed are set, also save pass.
   * @param oldPass String
   * @param newPass String
   * @param seed String
   * @param onComplete Function
   */
  savePreferences : function(oldPass, newPass, seed, onComplete){
    var connection = new Connection('/user/preferences');
    var i=0;
    this._preferences.each(function(pair){
      connection.addParameter("name_"+i, pair.key);
      connection.addParameter("value_"+i, pair.value);
      i++;
    });
    if(oldPass && newPass)
    {
      connection.addParameter("name"+i, "password");
      connection.addParameter("value_"+i, newPass);
      connection.addParameter("crt", oldPass);
      connection.addParameter("pass_seed", seed);
    }
    connection.onComplete = onComplete;
    connection.sendAsync();
  }
});
