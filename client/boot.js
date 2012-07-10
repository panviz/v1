/**
 * Main BootLoader.
 * Defaults params for constructor should be settings.json
 */
Class.create("Bootstrap", {
  /**
   * @var p properties Hash
   */
  p: $H({}),
  /**
   * @var connection - class variable 
   */
  connection: null,
  /**
   * @param options JSON
   */
  initialize : function(options){
    this.p = $H(options);
    if(this.p.get("ALERT")){
      window.setTimeout(function(){alert(this.p.get("ALERT"));}.bind(this),0);
    }   
    var url = this.p.get('url')+(this.p.get("debugMode") ? '&debug=true' : '');

    //Load app settings to init with
    connection = new Connection(url);
    connection.onComplete = this._onSettingsLoaded.bind(this);
    Event.observe(document, 'dom:loaded', function(){
      connection.sendSync();
    })
  },
  
  init : function(connection){
    // Refresh window variable
    window.THEME = this.p.get('ui').theme;
    if(this.p.get('additional_js_resource')){
      connection.loadLibrary(this.p.get('additional_js_resource?v='+this.p.get("version")));
    }
    if(!this.p.get("debug")){
      connection.loadLibrary("app.js?v="+this.p.get("version"));
    }
    window.I18N = this.p.get("i18n");
    document.fire("app:boot_loaded");
    window.app = new Application(this.p);
    $('version_span').update(' - Version '+this.p.get("version") + ' - '+ this.p.get("versionDate"));
  },
  _onSettingsLoaded : function(transport){
    var response = transport.responseJSON;
    if(response && response.error){
      window.alert('Exception caught by application : ' + response.error);
      return;
    }
    this.p.update(response);
    this.init(connection);
  },
});

window.bootstrap = new Bootstrap({url: 'settings.json'})
