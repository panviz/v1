/**
 * Actions Manager
 */
Class.create("ActionFul", {
  _instances: new Hash(),
  _registeredKeys: new Hash(),
  
  initialize : function(names){
    this.register(names)
    document.fire("app:actions_loaded", this._instances);
    
    //this.bgManager = new Tasker(this);   
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
    
    document.observe('keydown', this._onKeyDown.bind(this));
  },
  /**
   * Registers an action to this manager
   * @param action Action
   */
  set : function(action){
    var actionName = action.__className;
    this._instances.set(actionName, action);
    if(action.p.accessKey){
      this.registerKey(action.p.accessKey, actionName)
    }
    //if(action.p.defaults){
      //for(var key in action.p.defaults) this.defaultActions.set(key, actionName);
    //}
  },
  /**
   * Find an action by name
   * @param actionName String
   * @returns Action
   */
  get : function(actionName){
    return this._instances.get(actionName);   
  },
  /**
   * @param {String|String[]} names of initialized actions
   */
  register : function(names){
    var self = this
    if (!Object.isArray(names)) names = [names]
    names.each(function(name){
      var className = Class.getByName('Action' + name)
      var action = new className()
      self.set(action)
    })
  },
  /**
   * Generic method to get actions for a given component part.
   * @param className String 
   * @param widgetId String
   * @returns $A()
   */
  getActionsForWidget : function(className, widgetId){
    var actions = $A([]);
    this._instances.each(function(pair){
      var action = pair.value;
      if(action.context.widgets && (action.context.widgets.include(className+'::'+widgetId)||action.context.widgets.include(className)) && !action.deny) actions.push(action);
    });
    return actions;   
  },
  /**
   * Fire an action based on its name
   * @param buttonAction String The name of the action
   */
  fireAction : function (buttonAction)  {   
    var action = this._instances.get(buttonAction);
    if(action != null) {
      var args = $A(arguments);
      args.shift();
      action.apply(args);
      return;
    }
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
        var action = this._instances.get(actionName);
        if(action) action.enable(); // Force enable on default action
      }
      this.fireAction.apply(this, arguments);
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
    this._registeredKeys.set(key, actionName)
  },
  /**
   * Remove all registered keys.
   */
  clearRegisteredKeys : function(){
    this._registeredKeys = new Hash();
  },
  /**
   * Triggers an action by its access key
   * @param keyName String A key name
   */
  fireActionByKey : function(keyName){   
    if(this._registeredKeys.get(keyName) && !app.blockShortcuts){ 
      if(this._registeredKeys.get(keyName).indexOf("::")!==false){
        var parts = this._registeredKeys.get(keyName).split("::");
        this.fireAction(parts[0], parts[1]);
      }else{
        this.fireAction(this._registeredKeys.get(keyName));
      }
    }
    return
  },
  /**
   * Spreads a selection change to all actions and to registered components 
   * by triggering app:actions_refreshed event.
   */
  fireSelectionChange : function(){
    var userSelection = null;
    if ($item && $item.selection){
      userSelection = $item.selection
      if(userSelection.isEmpty()) userSelection = null;
    } 
    this._instances.each(function(pair){
      pair.value.fireSelectionChange(userSelection);
    });   
    document.fire("app:actions_refreshed");
  },
  /**
   * Spreads a context change to all actions and to registered components 
   * by triggering app:actions_refreshed event.
   */
  fireContextChange : function(){
    //var item = $app.getContext(),
      //isRecycle = item.getMime() == "recycle",
      //isInZip = item.hasMimeInBranch("browsable_archive") || false,
      //isRoot = item.isRoot() || false,
      //mime = item.getMime()
    this._instances.each(function(name){
      name.value.fireContextChange({
        //isRecycle: isRecycle || false, 
        //isInZip: isInZip, 
        //isRoot: isRoot,
        //mime: mime || ''
      })
    }.bind(this));
    document.fire("app:actions_refreshed");
  },
  /**
   * Remove all actions
   */
  removeActions : function(){
    this._instances.each(function(pair){
      pair.value.remove();
    });
    this._instances = new Hash();
    this.clearRegisteredKeys();
  },
  /**
   * Get the action defined as default for a given default string
   * @param defaultName String
   * @returns Action
   */
  getDefaultAction : function(defaultName){
    if(this.defaultActions.get(defaultName)){
      return this._instances.get(this.defaultActions.get(defaultName));
    }
    return null;
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
    this._instances.each(function(pair){
      var action = pair.value;
      if(!action.context.contextMenu) return;
      if(actionsSelectorAtt == 'selectionContext' && !action.context.selection) return;
      if(actionsSelectorAtt == 'directoryContext' && !action.context.dir) return;
      if(actionsSelectorAtt == 'genericContext' && action.context.selection) return;
      if(action.contextHidden || action.deny) return;
      /**
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

  _onKeyDown : function(e){
    var key = ''
    if (e.ctrlKey) key += 'Ctrl' 
    if (e.altKey) key += 'Alt' 
    if (e.shiftKey) key += 'Shift' 
    key += String.fromCharCode(e.keyCode).toLowerCase()
    this.fireActionByKey(key)
  }
})
