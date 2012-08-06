/**
 * Show/Edit Item/Collection
 */
Class.create("View", Module, {
  //__implements : ["Focusable"],

  //@var Boolean Current state of the view
  fullScreen : false,
  
  /**
   * Constructor
   * @param $super klass Reference to the constructor
   * @param oElement HTMLElement
   */
  initialize: function($super, oElement, p){
    debugger
    this.element = oElement;
    this.title = 'View Title';
    this.p = Object.extend({
      maximizable: true, 
      closable: true, 
      floatingToolbar: false
    }, p || { });   
    this._initGUI(formId);
    this.initActions();

  // changing context in other view triggers this event
    //this._registerObserver(document, "app:context_changed", this._onContextChanged);
    //this._registerObserver(document, "app:context_loading", loadingObs);
    //this._registerObserver(document, "app:selection_changed", _onSelectionChanged);
    //this._registerObserver(document, "app:provider_changed", this._providerChanged.bind(this));
  },

  // TODO add this view to Ext Viewport
  update : function(data){
  },

  /**
   * Initialize standards view actions
   */
  initActions : function(){
  },

  /**
   * Creates the base GUI
   */
  _initGUI : function(sFormId, fOnLoad, fOnComplete, fOnCancel, bOkButtonOnly, skipButtons)
  {
    // PASSED A PREFETCHED HIDDEN FORM
  },

  _onContextChanged : function(data){
    var currentDir = app.getContextNode().getPath();
    this.open(app.getUserSelection());    
  },

  /**
   * Focus on this widget (focus input)
   */
  focus : function(){
    if(this.element && this.element.visible()){
      //this._inputBox.activate();
      this.hasFocus = true;
    }
  },

  /**
   * Blur this widget
   */
  blur : function(){
    //this._inputBox.blur();
    this.hasFocus = false;
  },

  /**
   * Updates the view title
   * @param title String
   */
  updateTitle : function(title){
  },

  /**
   * Open note in new context
   * @param userSelection Collection the data model
   */
  open : function(userSelection){
    this.userSelection = userSelection;
    this.clearContent();
  },

  /**
   * Change editor status
   * @param isModified Boolean
   */
  setModified : function(isModified){
    //TODO update title in header
    //TODO update actions state
  },

  /**
   * Go to fullscreen mode
   */
  setFullScreen : function(){
    this.fullScreen = true;
    //TODO notify other views & controls
    //TODO update actions
    //TODO change content style (layout, bounding) on resize
  },

  /**
   * Exit fullscreen mode
   */
  exitFullScreen : function(){
    this.fullScreen = false;
    //TODO opposite to fullScreen
  },

  /**
   * Close the view
   * @returns Boolean
   */
  close : function(){   
    //TODO exitFullScreen();
  }
});
