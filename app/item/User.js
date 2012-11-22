/**
 * Authentication, and management of Repositories and preferences
 */
Class.create("User", {

  initialize : function(item){
    this.item = item
    this.contexts = []
  },

  update : function(data, diff){
    var self = this
    var update = data || diff
    $w('loggedIn lastLogin roles preferences context contexts').each(function(attr){
      if (update[attr] != undefined){
        if (diff && Object.isArray(update[attr])){
          self[attr] = self[attr].diffMerge(update[attr])
        } else {
          self[attr] = update[attr]
        }
        delete update[attr]
      }
    })
    this.roles = this.roles || ['guest'];
    if (update.token){
      SECURE_TOKEN = this.token = update.token;
      this.login(this.context, this.contexts)
    }
  },

  // Current user login
  login : function(context, contexts){
    //TODO remove after debugging
    $user = this;
    document.fire("user:auth", this);
    // Select last edited item
    this.context = context ? $app.getItem(context) : this.item;
    document.fire("app:context_changed", this.context);
    // restore all opened items from last save
    var items = contexts.map(function(id){
      var item = $app.getItem(id)
      item.pinned = true
      return item
    })
    if (items.length > 1) document.fire("app:selection_changed", items);
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
