/**
 * Encapsulation of the lightbox script for $modal.windows. Used for alerting user, but
 * also for all popup forms (generic_dialog_box)
 */
Class.create("Modal", {

  initialize : function(p){
    var p = p || {};
    this._window = Ext.create('Ext.window.Window', {
      title: p.title || 'Modal',
      height: 200,
      width: 350,
      layout: {
        type: 'vbox'
      }
    });
  },

  /**
   * @param form Object
   * @param size Object width and height of modal window
   * @param title String window header name
   */
  show : function(form, size, title){
    var win = this._window;
    win.items.add(form);
    win.setSize(size);
    win.setTitle(title);
    win.show();
  },

  hide : function(){
    this._window.removeAll();
    this._window.hide();
  },

  showBooting : function(p){
    //TODO get template from Registry
    //TODO retrive from settings bootstrap.p.get("version") bootstrap.p.get("versionDate"));
    //var html = '<div>The web data-browser<span id="versionSpan">Version: {version} - {versionDate}</span></div>by Dmitra.'
    var text = 'The web data-browser by Dmitra';
    var extText = Ext.create('Ext.draw.Text',{
      text: text,
      height: 20
    })
    this._createLoaderBar(p.steps);
    this._window.items.add(extText);
    this._window.items.add(this._progressBar);
    this._window.show()
  },

  // @param error Error
  error : function(error){
    alert(error);
  },
  
  /**
   * Find an editor using the editorData and initialize it
   * @param editorData Object
   */
  openEditorDialog : function(editorData){
    if(!editorData.formId){
      $app.displayMessage('ERROR', 'Error, you must define a formId attribute in your &lt;editor&gt; manifest (or set it as openable="false")');
      return;
    }
    var editorKlass = editorData.editorClass;
    $modal.prepareHeader(editorData.text, resolveImageSource(editorData.icon, '/image/action/ICON_SIZE', 16));
    var loadFunc = function(oForm){     
      if(typeof(editorKlass) == "string"){
        $app.actionBar.editor = eval('new '+editorKlass+'(oForm)');
      }else{
        $app.actionBar.editor = new editorKlass(oForm);
      }
      $app.actionBar.editor.open($app.getUserSelection());
      //app.actionBar.editor.resize();
    };
    this.showDialogForm('', editorData.formId, loadFunc, null, null, true, true);     
  },

  /**
   * Adds buttons to the content
   * @param oForm HTMLElement Current form
   * @param fOnCancel Function Callback on cancel
   * @param bOkButtonOnly Boolean Hide cancel
   */
  addSubmitCancel : function(oForm, fOnCancel, bOkButtonOnly){},
  
  /**
   * Callback to be called on close
   * @param func Function
   */
  setCloseValidation : function(func){
    this.closeValidation = func;
  },
  
  /**
   * Callback to be called on close
   * @param func Function
   */
  setCloseAction : function(func){
    this.closeFunction = func;
  },
  
  /**
   * Close action. Remove shadow if any, call close callback if any.
   */
  close : function(){  
    Shadower.deshadow($(this.elementName));
    if(this.closeFunction){
       this.closeFunction();
       //this.closeFunction = null;
    }
  },

  setTitle : function (){
    //TODO update view title (from editor)
  },

  _createLoaderBar : function(stepCount){
    var bar = this._progressBar = Ext.create('Ext.ProgressBar', {
      width: 300,
      text:'Initializing...'
    });
    bar.stepCount = stepCount;
    bar.currentStep = 0;
  },

  /**
   * Visualize loading process step by step
   * @param state Integer Current loading step
   */
  updateLoadingProgress: function(text){  
    var bar = this._progressBar;
    bar.currentStep++;
    bar.updateText(text)
    bar.updateProgress(bar.currentStep/bar.stepCount)
    if (bar.currentStep == bar.stepCount){
      this.hide();
    }
  }
});
