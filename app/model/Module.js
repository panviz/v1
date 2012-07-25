/*
 */
Class.create("Module", Reactive, {
  /*
   * TODO Modules should be added from elsewhere or parsed ALL of them
   */
  _names : [
      'editor.text'
    , 'uploader.html'
    //, 'downloader.http'
  ],

  //Extension path convensions
  _path : {
    config: '/config.json'
  , actionConfig: '/actions.json'
  , icon: 'icon.ico'
  , actions: '/action'
  , i18n: '/i18n'
  , driver: '/driver'
  , provider: '/provider'
  },
  
  load : function(){
    var extPath = '/module/' + name.replace('.','/');
    var obj = {}
    
    //Change paths to absolute
    _.keys.each(function(key){
      path[key] = (ROOT_PATH + extPath + path.key);
    })

    var ext = {
      config: require(path.config)
    , i18n: requireAll(path.i18n)
    }

    var type = name.split('.')[0];

    this._extensions.name = ext;
  }
})
