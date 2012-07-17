/**
 * Action Factory
 */
Class.create("ActionFul", {
  
  /**
   * Standard constructor
   * @param bUsersEnabled Boolen Whether users management is enabled or not
   */
  initialize : function(bUsersEnabled){
    this._registeredKeys = new Hash();
    this._actions = new Hash();
    this.usersEnabled = bUsersEnabled;
    
    this.bgManager = new BackgroundManager(this);   
    this.subMenus = [];       
    this.defaultActions = new Hash();
    this.toolbars = new Hash();   
    document.observe("app:context_changed", function(event){
      window.setTimeout(function(){
        this.fireContextChange();
      }.bind(this), 0);     
    }.bind(this) );
    
    document.observe("app:selection_changed", function(event){
      window.setTimeout(function(){
        this.fireSelectionChange();
      }.bind(this), 0);
    }.bind(this) );
    
    document.observe("app:user_logged", function(event){
      if(event.memo && event.memo.getPreference){
        this.setUser(event.memo);
      }else{
        this.setUser(null);
      }
    }.bind(this));
    
  },  
  
  /**
   * Stores the currently logged user object
   * @param user Object
   */
  setUser : function(user){   
    this.user = user;
    if(user != null && app  && user.id != 'guest' && user.getPreference('lang') != null 
      && user.getPreference('lang') != "" 
      && user.getPreference('lang') != app.currentLanguage) { 
      app.loadI18NMessages(user.getPreference('lang'));
    }
  },
      
  /**
   * Filter the actions given the srcElement passed as arguments. 
   * @param srcElement String An identifier among selectionContext, genericContext, a webfx object id
   * @returns Array
   */
  getContextActions : function(srcElement){     
    var actionsSelectorAtt = 'selectionContext';
    if(srcElement.id && (srcElement.id == 'table_rows_container' ||  srcElement.id == 'selectable_div')){ 
      actionsSelectorAtt = 'genericContext';
    }
    else if(srcElement.id.substring(0,5)=='webfx'){ 
      actionsSelectorAtt = 'directoryContext';
    }
    var contextActions = new Array();
    var defaultGroup;
        var contextActionsGroup = {};
    this._actions.each(function(pair){
      var action = pair.value;
      if(!action.context.contextMenu) return;
      if(actionsSelectorAtt == 'selectionContext' && !action.context.selection) return;
      if(actionsSelectorAtt == 'directoryContext' && !action.context.dir) return;
      if(actionsSelectorAtt == 'genericContext' && action.context.selection) return;
      if(action.contextHidden || action.deny) return;
            /*
      if(crtGroup && crtGroup != action.context.actionBarGroup){
        contextActions.push({separator: true});
      }
      */
            if(!contextActionsGroup[action.context.actionBarGroup]){
                contextActionsGroup[action.context.actionBarGroup] = $A();
            }
      var isDefault = false;
      if(actionsSelectorAtt == 'selectionContext'){
        // set default in bold
        var userSelection = app.getUserSelection();
        if(!userSelection.isEmpty()){
          var defaultAction = 'file';
          if(userSelection.isUnique() && (userSelection.hasDir() || userSelection.hasMime(['browsable_archive']))){
            defaultAction = 'dir';
          }
          if(this.defaultActions.get(defaultAction) && action.p.name == this.defaultActions.get(defaultAction)){
            isDefault = true;
          }
        }
      }
      var menuItem = {
        name: action.getKeyedText(),
        alt: action.p.title,
        image: resolveImageSource(action.p.src, '/image/action/ICON_SIZE', 16),
        isDefault: isDefault,
        callback: function(e){this.apply();}.bind(action)
      };
      if(action.p.subMenu){
        menuItem.subMenu = [];
        if(action.subMenuItems.staticOptions){
          menuItem.subMenu = action.subMenuItems.staticOptions;
        }
        if(action.subMenuItems.dynamicBuilder){
          menuItem.subMenuBeforeShow = action.subMenuItems.dynamicBuilder;
        }
      }
      //contextActions.push(menuItem);
            contextActionsGroup[action.context.actionBarGroup].push(menuItem);
            if(isDefault){
          defaultGroup = action.context.actionBarGroup;
            }
    }.bind(this));
        var first = true;
        contextActionsGroup = $H(contextActionsGroup);
        contextActionsGroup = contextActionsGroup.sortBy(function(p){
            if(defaultGroup && p.key == defaultGroup) return 'aaaa';
            return p.key;
        });
    contextActionsGroup.each(function(pair){
            if(!first){
                contextActions.push({separator: true});
            }
            first = false;
            pair.value.each(function(mItem){
                contextActions.push(mItem);
            });
        });
    return contextActions;
  },
  
  /**
   * Generic method to get actions for a given component part.
   * @param className String 
   * @param widgetId String
   * @returns $A()
   */
  getActionsForWidget : function(className, widgetId){
    var actions = $A([]);
    this._actions.each(function(pair){
      var action = pair.value;
      if(action.context.widgets && (action.context.widgets.include(className+'::'+widgetId)||action.context.widgets.include(className)) && !action.deny) actions.push(action);
    });
    return actions;   
  },
  
  /**
   * Finds a default action and fires it.
   * @param defaultName String ("file", "dir", "dragndrop", "ctrldragndrop")
   */
  fireDefaultAction : function(defaultName){
    var actionName = this.defaultActions.get(defaultName); 
    if(actionName != null){
      arguments[0] = actionName;
      if(actionName == "ls"){
        var action = this._actions.get(actionName);
        if(action) action.enable(); // Force enable on default action
      }
      this.fireAction.apply(this, arguments);
    }
  },
  
  /**
   * Fire an action based on its name
   * @param buttonAction String The name of the action
   */
  fireAction : function (buttonAction)  {   
    var action = this._actions.get(buttonAction);
    if(action != null) {
      var args = $A(arguments);
      args.shift();
      action.apply(args);
      return;
    }
  },
  
  /**
   * Registers an accesskey for a given action. 
   * @param key String The access key
   * @param actionName String The name of the action
   * @param optionnalCommand String An optionnal argument 
   * that will be passed to the action when fired.
   */
  registerKey : function(key, actionName, optionnalCommand){    
    if(optionnalCommand){
      actionName = actionName + "::" + optionnalCommand;
    }
    this._registeredKeys.set(key.toLowerCase(), actionName);
  },
  
  /**
   * Remove all registered keys.
   */
  clearRegisteredKeys : function(){
    this._registeredKeys = new Hash();
  },
  /**
   * Triggers an action by its access key.
   * @param event Event The key event (will be stopped)
   * @param keyName String A key name
   */
  fireActionByKey : function(event, keyName){   
    if(this._registeredKeys.get(keyName) && !app.blockShortcuts){ 
      if(this._registeredKeys.get(keyName).indexOf("::")!==false){
        var parts = this._registeredKeys.get(keyName).split("::");
        this.fireAction(parts[0], parts[1]);
      }else{
        this.fireAction(this._registeredKeys.get(keyName));
      }
      Event.stop(event);
    }
    return;
  },
  
  /**
   * Complex function called when drag'n'dropping. Basic checks of who is child of who.
   * @param fileName String The dragged element 
   * @param destDir String The drop target node path
   * @param destItemName String The drop target node name
   * @param copy Boolean Copy or Move
   */
  applyDragMove : function(fileName, destDir, destItemName, copy){ 
    if((!copy && !this.defaultActions.get('dragndrop')) || 
      (copy && (!this.defaultActions.get('ctrldragndrop')||this.getDefaultAction('ctrldragndrop').deny))){
      return;
    }
    if(fileName == null) fileNames = app.getUserSelection().getFileNames();
    else fileNames = [fileName];
    if(destItemName != null){ 
      // Check that dest is not a child of the source
      if(this.checkDestIsChildOfSource(fileNames, destItemName)){
        app.displayMessage('ERROR', I18N[202]);
        return;
      }
    }
        // Check that dest is not the source it self
        for(var i=0; i<fileNames.length;i++){ 
            if(fileNames[i] == destDir){
                if(destItemName != null) app.displayMessage('ERROR', I18N[202]);
                 return;
            }
        }
        // Check that dest is not the direct parent of source, ie current rep!
        if(destDir == app.getContext().getPath()){
            if(destItemName != null) app.displayMessage('ERROR', I18N[203]);
            return;
        }
    var connection = new Connection();
    if(copy){
      connection.addParameter('get_action', this.defaultActions.get('ctrldragndrop'));
    }else{
      connection.addParameter('get_action', this.defaultActions.get('dragndrop'));
    }
    if(fileName != null){
      connection.addParameter('file', fileName);
    }else{
      for(var i=0; i<fileNames.length;i++){
        connection.addParameter('file_'+i, fileNames[i]);
      }
    }
    connection.addParameter('dest', destDir);
    connection.addParameter('dir', app.getContext().getPath());   
    connection.onComplete = function(transport){this.parseXmlMessage(transport.responseXML);}.bind(this);
    connection.sendAsync();
  },
  
  /**
   * Get the action defined as default for a given default string
   * @param defaultName String
   * @returns Action
   */
  getDefaultAction : function(defaultName){
    if(this.defaultActions.get(defaultName)){
      return this._actions.get(this.defaultActions.get(defaultName));
    }
    return null;
  },
  
  /**
   * Detects whether a destination is child of the source 
   * @param srcNames String|Array One or many sources pathes
   * @param destItemName String the destination
   * @returns Boolean
   */
  checkDestIsChildOfSource : function(srcNames, destItemName)
{ 
    if(typeof srcNames == "string"){
      srcNames = [srcNames];
    }
    var destItem = webFXTreeHandler.all[destItemName];
    while(destItem.parentItem){
      for(var i=0; i<srcNames.length;i++){
        if(destItem.filename == srcNames[i]){       
          return true;
        }
      }
      destItem = destItem.parentItem;
    }
    return false;
  },
    
  /**
   * Submits a form using Connection class.
   * @param formName String The id of the form
   * @param post Boolean Whether to POST or GET
   * @param completeCallback Function Callback to be called on complete
   */
  submitForm : function(formName, post, completeCallback){ 
    var connection = new Connection();
    if(post){
      connection.setMethod('POST');
    }
    $(formName).getElements().each(function(fElement){
      // OPERA : ADDS 'http://www.yourdomain.com/app/' to the action attribute value
      var fValue = fElement.getValue();
      if(fElement.name == 'get_action' && fValue.substr(0,4) == 'http'){      
        fValue = getBaseName(fValue);
      }
      if(fElement.type == 'radio' && !fElement.checked) return;
      connection.addParameter(fElement.name, fValue);
    });
    if(app.getContext()){
      connection.addParameter('dir', app.getContext().getPath());
    }
    if(completeCallback){
      connection.onComplete = completeCallback;
    }else{
      connection.onComplete = function(transport){this.parseXmlMessage(transport.responseXML);}.bind(this) ;
    }
    connection.sendAsync();
  },
  
  /**
   * Standard parser for server XML answers
   * @param xmlResponse DOMDocument 
   */
  parseXmlMessage : function(xmlResponse){
    var messageBox = app.messageBox;
    if(xmlResponse == null || xmlResponse.documentElement == null) return;
    var childs = xmlResponse.documentElement.childItems;  
    
    var reloadItems = [];
    
    for(var i=0; i<childs.length;i++){ 
      if(childs[i].tagName == "message"){ 
        var messageTxt = "No message";
        if(childs[i].firstChild) messageTxt = childs[i].firstChild.nodeValue;
        app.displayMessage(childs[i].getAttribute('type'), messageTxt);
      }
      else if(childs[i].tagName == "reload_instruction"){ 
        var obName = childs[i].getAttribute('object');
        if(obName == 'data'){ 
          var node = childs[i].getAttribute('node');        
          if(node){
            reloadItems.push(node);
          }else{
            var file = childs[i].getAttribute('file');
            if(file){
              app.getContextHolder().setPendingSelection(file);
            }
            reloadItems.push(app.getContext());
          }
        }
        else if(obName == 'repository_list'){ 
          app.reloadRepositoriesList();
        }
      }
      else if(childs[i].tagName == "logging_result"){ 
        if(childs[i].getAttribute("secure_token")){
          Connection.SECURE_TOKEN = childs[i].getAttribute("secure_token");
          var parts = window.serverAccessPath.split("?secure_token");
          window.serverAccessPath = parts[0] + "?secure_token=" + Connection.SECURE_TOKEN;
          bootstrap.p.set('serverAccess', window.serverAccessPath);
        }
                if($("generic_dialog_box") && $("generic_dialog_box").down(".login_error")){
                    $("generic_dialog_box").down(".login_error").remove();
                }
        var result = childs[i].getAttribute('value');
                var errorId = false;
        if(result == '1'){
          hideLightBox(true);
          if(childs[i].getAttribute('remember_login') && childs[i].getAttribute('remember_pass')){
            var login = childs[i].getAttribute('remember_login');
            var pass = childs[i].getAttribute('remember_pass');
            storeRememberData(login, pass);
          }
          app.loadXmlRegistry();
        }
        else if(result == '0' || result == '-1'){ 
                    var errorId = 285;
        }
        else if(result == '2'){           
          app.loadXmlRegistry();
        }
        else if(result == '-2'){ 
                    var errorId = 285;
        }
        else if(result == '-3'){ 
                    var errorId = 366;
        }
        else if(result == '-4'){ 
                    var errorId = 386;
        }
                if(errorId){
                    if($("generic_dialog_box") && $("generic_dialog_box").visible() && $("generic_dialog_box").down("div.dialogLegend")){
                        $("generic_dialog_box").down("div.dialogLegend").insert({bottom: '<div class="login_error" style="background-color: #D33131;display: block;font-size: 9px;color: white;border-radius: 3px;padding: 2px 6px;">'+I18N[errorId]+'</div>'});
                        $("generic_dialog_box").shake();
                    }else{
                        alert(I18N[errorId]);
                    }
                }

      }else if(childs[i].tagName == "trigger_bg_action"){
        var name = childs[i].getAttribute("name");
        var messageId = childs[i].getAttribute("messageId");
        var parameters = new Hash();
        for(var j=0;j<childs[i].childNodes.length;j++){
          var paramChild = childs[i].childNodes[j];
          if(paramChild.tagName == 'param'){
            parameters.set(paramChild.getAttribute("name"), paramChild.getAttribute("value"));
          }
        }
        this.bgManager.queueAction(name, parameters, messageId);
        this.bgManager.next();
      }

    }
    if(reloadNodes.length){
      app.getContextHolder().multipleItemsReload(reloadNodes);
    }
  },
  
  /**
   * Spreads a selection change to all actions and to registered components 
   * by triggering app:actions_refreshed event.
   */
  fireSelectionChange : function(){
    var userSelection = null;
    if (app && app.getUserSelection()){
      userSelection = app.getUserSelection();
      if(userSelection.isEmpty()) userSelection = null;
    } 
    this._actions.each(function(pair){
      pair.value.fireSelectionChange(userSelection);
    });   
    document.fire("app:actions_refreshed");
  },
  
  /**
   * Spreads a context change to all actions and to registered components 
   * by triggering app:actions_refreshed event.
   */
  fireContextChange : function(){
    if(app && app.getContext()){ 
      var item = app.getContext(),
          isRecycle = item.getMime() == "recycle",
          isInZip = item.hasMimeInBranch("browsable_archive") || false,
          isRoot = item.isRoot() || false,
          mime = item.getMime();      
    } 
    this._actions.each(function(name){
      name.value.fireContextChange({
        usersEnabled: this.usersEnabled, 
        user: this.user,                   
        isRecycle: isRecycle || false, 
        isInZip: isInZip, 
        isRoot: isRoot,
        mime: mime || ''
      });
    }.bind(this));
    document.fire("app:actions_refreshed");
  },
      
  /**
   * Remove all actions
   */
  removeActions : function(){
    this._actions.each(function(pair){
      pair.value.remove();
    });
    this._actions = new Hash();
    this.clearRegisteredKeys();
  },
  
  /**
   * Create actions from XML Registry
   * @param registry DOMDocument
   */
  initActions : function(actions){
    this.removeActions();   
    var names = Object.keys(actions);
    for(var i=0; i<names.length; i++){
      var params = actions[names[i]];
      if(params.enabled == false) continue;
      //TODO create all classes for Actions
      var className = Class.getByName(names[i]);
      if (!className){
        className = Class.create(names[i], Action)
      }
      var action = new className(params);
      this.registerAction(action);
    }
    if(app && app.guiActions){
      app.guiActions.each(function(pair){
        var action = pair.value;
        this.registerAction(action);
      }.bind(this));
    }
    document.fire("app:actions_loaded", this._actions);
    this.fireContextChange();
    this.fireSelectionChange();   
  },
  
  /**
   * Registers an action to this manager (default, accesskey).
   * @param action Action
   */
  registerAction : function(action){
    var actionName = action.__className;
    this._actions.set(actionName, action);
    if(action.p.defaults){
      for(var key in action.p.defaults) this.defaultActions.set(key, actionName);
    }
    if(action.p.hasAccessKey){
      this.registerKey(action.p.accessKey, actionName);
    }
    if(action.p.specialAccessKey){
      this.registerKey("key_" + action.p.specialAccessKey, actionName);
    }
    action.setManager(this);
  },
  
  /**
   * Find an action by name
   * @param actionName String
   * @returns Action
   */
  get : function(actionName){
    return this._actions.get(actionName);   
  },
  
  /**
   * Utilitary to get FlashVersion, should probably be removed from here!
   * @returns String
   */
  getFlashVersion : function(){ 
    if (!this.pluginVersion) {
      var x;
      if(navigator.plugins && navigator.mimeTypes.length){
        x = navigator.plugins["Shockwave Flash"];
        if(x && x.description) x = x.description;
      } else if (Prototype.Browser.IE){
        try {
          x = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
          x = x.GetVariable("$version");
        } catch(e){}
      }
      this.pluginVersion = (typeof(x) == 'string') ? parseInt(x.match(/\d+/)[0]) : 0;
    }
    return this.pluginVersion;
  }
});
