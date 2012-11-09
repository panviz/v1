/**
 * Object pool of application managers
 * TODO Need responsible class for i18n?
 */
Class.create("Application", {
  unsavedItemsCounter: 0,

  initialize : function(){ 
    var self = this;
    ROOT_PATH = '/';
    isServer = false;
    require = function(filename){
      return {};
    }
    $util = new Util();
    $proxy = new Proxy($set.socketPath);

    // Proxy should be ready to answer subscribers started in init()
    document.observe("proxy:connected", function(){
      self.init()
    })
  },

  init : function(){
    var self = this;
    this.items = $H();
    this.man = {};
    $user = null;
    SECURE_TOKEN = null;
    this._context = null;
    //this._focusables = [];
    //this.historyCount = 0;

    //TODO add %s substitution
    var i18n = this.i18n = function(msg, variation){
      if (i18n.current == 'en' || !i18n[msg]) return msg;
      if (variation >= 0){
        return i18n[msg + variation];
      }
      return i18n[msg];
    }
    i18n.update = function(set){
      Object.extend(i18n, set);
      Object.extend(i18n._object, set);   //for inspect purpose
    }
    i18n._object = {};
    i18n.current = $set.currentLanguage;
    var local = $set.i18n;
    if (local) i18n.update(local);
    t = i18n;     //Set Global translation function

    this.db                  = new StoreClient();
    $mod = this.modular = this.man['module'] = new Modular();
    //$act = this.actionFul    = new ActionFul();
    $gui = this.gui = this.man['gui'] = new Gui($set);
    $modal = $gui.modal;
    //$item = this.provider= new Provider();

    //TODO update progress bar from right places
    this.gui.modal.showBooting({steps: 2});

    document.observe("user:auth", this._onCurrentUser.bind(this));
    this.gui.modal.updateLoadingProgress(t('Actions: Done'));
      
    //this._setHistory();
    //Automatically logout user on session timeout
    this.activityMonitor = new ActivityMonitor(
      $set.session_timeout, 
      $set.client_timeout,
      $set.client_timeout_warning);
      
    this.gui.modal.updateLoadingProgress(t('User Interface: Done'));
    document.fire('app:loaded');

    var onFind = function(array, err){
      if (array && array[0]){
        var data = array[0]
        SECURE_TOKEN = data.token
        var user = self.getItem(data.id)
        //reestablish authorized connection with remote
        user.type = data.type   // override default item type
        user.get(null, data.id, {force: true})
      }
    }
    this.db.find(onFind, 'user', 'token')
  },
  /**
   * Get or Create Item for further update by name
   * If name provided - create Item without immediate get to remote
   * @param String id itemID
   * @param String [name] provided if creating new Item
   */
  getItem : function(id){
    var items = this.items;
    return items.get(id) || items.set(id, new Item(id))
  },

  // return existing node or create without sync
  getItemByName : function(name){
    var items = this.items;
    if (items.get(name)){
      return items.get(name)
    } else{
      var item = new Item()
      item.name = name
      return items.set(name, item)
    }
  },

  createItem : function(name, p){
    var items = this.items;
    var baseName = t('new Node ')
    var isNameUsed = true
    // generate uniq name
    while (!name || isNameUsed){
      this.unsavedItemsCounter++
      name = baseName + this.unsavedItemsCounter
      isNameUsed = items.values().find(function(item){return item.name == name})
    }
    var item = new Item(null, p)
    item.id = $util.generateId()
    item.name = name
    item.changed = true
    item.save()
    return items.set(item.id, item)
  },

  save : function(){
    this.items.values().each(function(item){
      if (item.changed) item.save()
    })
  },
  // Search by name among loaded items for now
  search : function(pattern, global){
    //this.items.values().filter
    // highlight items satisfying search pattern
  },

  _onCurrentUser : function(e){
    var item = e.memo.item
    this.items.unset(item.name)
    this.items.set(item.id, item)
  },
  
  /**
   * Require a context change to the given path
   * @param {Item|String} itemOrPath A item or a path
   */
  goTo : function(itemOrPath){   
    if(Object.isString(itemOrPath)){
      item = new Item(itemOrPath);
    }else {
      item = itemOrPath;
    }
    this._contextHolder.requireContextChange(item);
  },
  /**
   * Change the repository of the current user and reload list and current.
   * @param String repositoryId Id of the new repository
   */
  triggerRepositoryChange : function(repositoryId){    
    document.fire("app:trigger_repository_switch");
    var connection = new Connection();
    connection.addParameter('get_action', 'switch_repository');
    connection.addParameter('repository_id', repositoryId);
    oThis = this;
    connection.onComplete = function(transport){
      this.repositoryId = null;
      this.loadRegistry();
    }.bind(this);
    var root = this._contextHolder.getRootItem();
    if(root){
      this.skipLsHistory = true;
      root.clear();     
    }
    connection.sendAsync();
  },
  /**
   * Trigger a simple download
   * @param url String
   */
  triggerDownload : function(url) {
      document.location.href = url;
  },
  /**
   * Reload all messages on language change
   * @param newLanguage String
   */
  loadI18NMessages : function(newLanguage){
    var connection = new Connection('/i18n/' + newLanguage);
    connection.onComplete = function(transport){
      if(transport.responseText){
        var result = transport.responseText.evalScripts();
        I18N = result[0];
        for(var key in I18N){
          I18N[key] = I18N[key].replace("\\n", "\n");
        }
        this.updateI18nTags();
        if(this.guiActions){
          this.guiActions.each(function(pair){
            pair.value.setLabel();
          });
        }
        this.loadRegistry();
        this.fireContextRefresh();
        this.currentLanguage = newLanguage;
      }
    }.bind(this);
    connection.sendSync();
  },
  /**
   * Search all divs with class 'i18n' and update their value
   */
  updateI18nTags : function(){
    var messageTags = $$('[i18n]');   
    messageTags.each(function(tag){ 
      var messageId = tag.getAttribute("j_message_id");
      try{
        tag.update(I18N[messageId]);
      }catch(e){}
    });
  },
  
  _setHistory : function(){
    if(!Prototype.Browser.WebKit && !Prototype.Browser.IE){
      this.history = new Proto.History(function(hash){
        this.goTo(this.historyHashToPath(hash));
      }.bind(this));
      document.observe("app:context_changed", function(event){
        this.updateHistory(this.getContext().getPath());
      }.bind(this));
    }else{
      document.observe("app:context_changed", function(event){
        var path = this.getContext().getPath();
        document.title = this.title + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
      }.bind(this));
    }
    document.observe("app:context_changed", function(event){
      if(this.skipLsHistory || !this.user || !this.user.getActiveRepository()) return;      
      window.setTimeout(function(){
        var data = this.user.getPreference("ls_history", true) || {};
        data = new Hash(data);
        data.set(this.user.getActiveRepository(), this.getContext().getPath());
        this.user.setPreference("ls_history", data, true);
        this.user.savePreference("ls_history");
      }.bind(this), 100 );
    }.bind(this) );
  },
  /**
   * Updates the browser history
   * @param path String Path
   */
  updateHistory : function(path){
    if(this.history) this.history.historyLoad(this.pathToHistoryHash(path));
  },
  /**
   * Translate the path to a history step. Return the count.
   * @param path String
   * @returns Integer
   */
  pathToHistoryHash : function(path){
    document.title = this.title + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
    if(!this.pathesHash){
      this.pathesHash = new Hash();
      this.historyCount = -1;
    }
    var foundKey;
    this.pathesHash.each(function(pair){
      if(pair.value == path) foundKey = pair.key;
    });
    if(foundKey != undefined) return foundKey;
  
    this.historyCount++;
    this.pathesHash.set(this.historyCount, path);
    return this.historyCount;
  },
  /**
   * Reverse operation
   * @param hash Integer
   * @returns String
   */
  historyHashToPath : function(hash){
    if(!this.pathesHash) return "/";
    var path = this.pathesHash.get(hash);
    if(path == undefined) return "/";
    return path;
  },  
  /**
   * Accessor for updating the datamodel context
   * @param jContextItem Item optional
   * @param jSelectedItems Item[]
   * @param selectionSource String
   */
  updateContextData : function(jContextItem, jSelectedItems, selectionSource){
    if(jContextItem){
      this._contextHolder.requireContextChange(jContextItem);
    }
    if(jSelectedItems){
      this._contextHolder.setSelectedItems(jSelectedItems, selectionSource);
    }
  },
  /**
   * @returns Item
   */
  getContext : function(){
    return this._context;
  },
  /**
   * TODO remove
   * @returns Collection
   */
  getUserSelection : function(){
    return this._contextHolder;
  },    
  /**
   * Accessor for datamodel.requireContextChange()
   */
  fireContextRefresh : function(){
    this.getContextHolder().requireContextChange(this.getContext(), true);
  },
  /**
   * Accessor for datamodel.requireContextChange()
   */
  fireItemRefresh : function(itemPathOrItem){
    this.getContextHolder().requireItemReload(itemPathOrItem);
  },
  /**
   * Accessor for datamodel.requireContextChange()
   * TODO move out
   */
  fireContextUp : function(){
    if(this.getContext().isRoot()) return;
    this.updateContextData(this.getContext().getParent());
  },
  /**
   * Utility 
   * @returns Boolean
   */
  cancelCopyOrMove : function(){
    this.actionBar.treeCopyActive = false;
    hideLightBox();
    return false;
  }
});
