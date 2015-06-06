/**
 * Authentication, and management of Repositories and preferences
 */
Class.create("User", {

  initialize : function(item){
    this.toStore = $w('preferences context contexts')
    this.item = item
    this.contexts = []
  },

  update : function(data, diff){
    var self = this
    var update = data || diff
    this.toStore.concat($w('loggedIn lastLogin roles')).each(function(attr){
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
      //TODO set pinned in itemman
      item.pinned = true
      return item
    })
    if (items.length > 1) document.fire("app:selection_changed", items);
  },

  save : function(){
    var self = this
    var content = {}
    this.toStore.each(function(attr){
      if (attr == 'context') return content[attr] = self.context.id
      content[attr] = self[attr]
    })
    return content
  },

  addContext : function(item){
    this.context = item.id
    if (this.contexts.include(item.id)) return
    this.contexts.push(item.id)
    this.item.change()
  },

  removeContext : function(item){
    if (!this.contexts.include(item.id)) return
    this.contexts = $user.contexts.without(item.id)
    this.item.change()
  },

  isAdmin : function(){
    this._isAdmin = this._isAdmin !== undefined ? this._isAdmin : this.roles.include('admin');
    return result;
  },

  setRole : function(role){
    this.roles.push(role);
    if (role == "admin") this._isAdmin = true;
    this.item.change()
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
