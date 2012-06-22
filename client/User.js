/**
 * User management
 */
Class.create("User", {

	/**
	 * @param data Json
	 */
	initialize : function(data){
		this.id = data.id;
		this._preferences = $H(data.preferences);
		this.repositories = new Hash();
		this.crossRepositories = new Hash();
		this._repoIcon = new Hash();
		this._repoSearchEngines = new Hash();
		this.setRepositoriesList(repositories);
		this.isAdmin = data.roles.include('admin');
		// Make sure it happens at the end
		if(data.active_repo){
			this.setActiveRepository(data.active_repo);
		}
	},

	/**
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
		this.activeRepository.loadResources();
	},
	/**
	 * Gets the current active repository
	 * @returns String
	 */
	getActiveRepository : function(){
		return this._activeRepository;
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
	getPreference : function(prefName, fromJSON){
	    var value = this.preferences.get(prefName);	
	    if(fromJSON && value){
	    	try{
                if(typeof value == "object") return value;
		    	return value.evalJSON();
	    	}catch(e){
                if(console){
                    console.log("Error parsing JSON in preferences ("+prefName+"). You should contact system admin and clear user preferences.");
                }else{
                    alert("Error parsing JSON in preferences. You should contact system admin and clear user preferences.");
                }
	    	}
	    }
	    return value;
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
		if(!this.preferences.get(name)) return;
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
