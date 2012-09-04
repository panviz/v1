/**
 * Object pool of application managers
 * TODO Need responsible class for i18n?
 */
Class.create("Application", {

  initialize : function(){ 
    var self = this;
    ROOT_PATH = '/';
    isServer = false;
    //TODO resolve conflict with streamline/require-stub
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
    this._context = null;
    //this._focusables = [];
    //this.historyCount = 0;

    //Public
    this.currentLanguage = $set.currentLanguage;
    this.db                  = new StoreClient();
    $mod = this.modular      = new Modular();
    $act = this.actionFul    = new ActionFul();
    $gui = this.gui          = new Gui($set);
    $modal = $gui.modal;
    //$provider = this.provider= new Provider();
    $i18n = this.i18n        = $set.i18n;

    //TODO update progress bar from right places
    $modal.showBooting({steps: 2});

    //listener on repository:loaded
    document.observe("app:context_changed", this._onContextChanged.bind(this));
    $modal.updateLoadingProgress('Actions: Done');
      
    this._setHistory();
    //Automatically logout user on session timeout
    this.activityMonitor = new ActivityMonitor(
      $set.session_timeout, 
      $set.client_timeout,
      $set.client_timeout_warning);
      
    $modal.updateLoadingProgress('User Interface: Done');
    document.fire('app:loaded');
  },

  /**
   * Create Item and save as current context
   * @event user loads repository
   * @param data item data
   */
  _onContextChanged : function(item){
    this._context = item;
    //TODO if path is not root goto path
    //this.goTo(item);
  },
  
  /**
   * Require a context change to the given path
   * @param itemOrPath Item|String A item or a path
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
   * @param repositoryId String Id of the new repository
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
    triggerDownload: function(url){
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
   * Search all j_message_id tags and update their value
   */
  updateI18nTags : function(){
    var messageTags = $$('[j_message_id]');   
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
        debugger
        this.updateHistory(this.getContext().getPath());
      }.bind(this));
    }else{
      document.observe("app:context_changed", function(event){
        debugger
        var path = this.getContext().getPath();
        document.title = this.title + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
      }.bind(this));
    }
    document.observe("app:context_changed", function(event){
      debugger
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
