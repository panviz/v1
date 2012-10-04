/**
 * Authentication, and management of Repositories and preferences
 */
Class.create("User", Item, {
  type: 'user',

  initialize : function($super, name, password){
    if (password){
      $super()
      var p = {password: password};
      this.put(this._update.bind(this), name, null, p);
    } else{
      $super(name);
    }
  },

  _update : function($super, data){
    $super(data);
    this.p = $H(data.preferences);
    this.roles = data.roles || ['guest'];

    // Current user
    if (data.SECURE_TOKEN){
      SECURE_TOKEN = this.token = data.SECURE_TOKEN;
      if (!data.id) return this.get(this._update.bind(this), data.name, {force: true});
      //TODO remove after debugging
      $user = this;
      document.fire("user:auth", this);
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
  }
});
