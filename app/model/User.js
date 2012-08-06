/*
 * Authentication, and management of Repositories and preferences
 */
Class.create("User", Reactive, {

  /**
   */
  initialize : function($super, name, password){
    if (password){
      this.store = $orm.getStorage(this.__className);
      var p = {password: password};
      this.put(this.update.bind(this), name, null, p)
    }
    else if (name){
      $super(name);
    }
  },

  update : function(data){
    var data = data || {};
    this.id = data.id;
    this.p = $H(data.preferences);
    this.p.set("SECURE_TOKEN", data.SECURE_TOKEN)
    this.roles = data.roles || ['guest'];

    this.providers = new Hash();
    //this.crossRepositories = new Hash();
    if (data.providers) this.setRepositoriesList(data.providers);
    if(data.active_repo){
      this.setActiveRepository(data.active_repo);
      this.loadActiveRepository()
    }
    if (this.id) document.fire("user:updated");
    if (data.SECURE_TOKEN) document.fire("user:auth");
  },

  /**
   * Load current User active Repository
   */
  loadActiveRepository : function(){
    var repo = user.getActiveRepository();
    if (!repo){
      var repoId = this.p.get("default_repository") || "public";
      var repo = new Repository(repoId, {limit:'root'});
      this._activeRepository = repo;
    }
      //TODO load last visited path
      //if(user.getPreference("pending_folder")){
        //this.repositoryId = user.getPreference("pending_folder");
        //user.setPreference("pending_folder", "");
        //user.savePreference("pending_folder");
      //}else if(user.getPreference("ls_history")){
        //var data = new Hash(user.getPreference("ls_history"));
        //this.repositoryId = data.get(repId);
      //}

    repo.load();    
    //document.fire("app:repository_list_refreshed", {list: repList, active: repId});
  },
  

  /**
   * TODO get Repository as param, instead of Id
   * Set current repository
   * @param p {id, read, write}
   */
  setActiveRepository : function (p){
    this._activeRepository = p.id;
    this._permissions.read = p.read || false;
    this._permissions.write = p.write || false;
    if(this.repositories.get(id)){
      this._permissions.copiable = this.repositories.get(id).copiable;
    }
    if(this.crossRepositories.get(id)){
      this._crossRepositories.unset(id);
    }
    this._activeRepository.loadResources();
  },
  /**
   * Gets the current active repository
   * @returns String
   */
  getActiveRepository : function(){
    return this.repositories.get(this._activeRepository);
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
   * Rights to read active repository
   * @returns Boolean
   */
  readable : function(){
    return this._permissions.read;
  },
  
  /**
   * Rights to write active repository
   * @returns Boolean
   */
  writable : function(){
    return this._permissions.write;
  },
  
  /**
   * Rights to copy active repository
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
   * Get all repositories 
   * @returns {Hash}
   */
  getRepositoriesList : function(){
    return this.repositories;
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
   * Init user's repositories
   * @param repoHash $H()
   */
  setRepositoriesList : function(data){
    data.each(function(repo){
      var newRepo = new Repository(repo);
      this.repositories.set(repo.id, newRepo);
      if(repo.copiable){
        this._crossRepositories.set(repo.id, newRepo);
      }
    })
  },
  /**
   * Whether there are any repositories allowing crossCopy
   * @returns Boolean
   */
  hasCrossRepositories : function(){
    return (this._crossRepositories.size());
  },
  /**
   * Get repositories allowing cross copy
   * @returns {Hash}
   */
  getCrossRepositories : function(){
    return this._crossRepositories;
  },
  /**
   * Get the current repository Icon
   * @param repoId String
   * @returns String
   */
  getRepositoryIcon : function(repoId){
    return this._repoIcon.get(repoId);
  },
  /**
   * Get the repository search engine
   * @param repoId String
   * @returns String
   */
  getRepoSearchEngine : function(repoId){
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
