/* @server
 * Imlements Store model for modules in /module path
 */
Class.create("StoreModule", Store, {
  name: 'module',
  _root: '/module',

  //Extension path convensions
  _path: {
    config: '/config.json'
  , action: '/action'
  , lib: '/lib'
  , i18n: '/i18n'
  , icon: '/icon.ico'
  , image: '/image'
  , doc: '/doc'
  },

  /**
   * @param source directory Path for File storage
   */
  initialize : function($super, toInit){
    $super();
    var self = this;
    var s = this._local[this.name] = [];

    toInit.forEach(function(id){
      s.push(self.initModule(id));
    })
  },

  // @param id full name of module (e.g.: provider.fs)
  initModule : function(name){
    var m = {};
    m.id = name;
    m.name = name;
    m.type = name.split('.')[0];
    var path = {};
    var root = path.root = ROOT_PATH + this._root + '/' + name.replace('.','/');
    
    //Change paths to absolute
    $H(this._path).each(function(el){
      path[el.key] = root + el.value;
    })
    m.config = require(path.config);
    m.i18n = $util.requireAll(path.i18n);
    var fileNames = wrench.readdirSyncRecursive(path.root);
    fileNames = fileNames.filter(function(file){
      return file.match(/.js$/)
    })
    m.src = fileNames.map(function(fileName){
      return fs.readFileSync(path.root + '/' + fileName, 'binary')
    })
    m.man = m.type.capitalize() + m.config.name.capitalize();

    return m;
  },

  //ensure type is right
  find : function($super, onFind, type, key, value){
    $super(onFind, this.name, key, value);
  },

  //ensure type is right
  save : function($super, onSave, type, name, diff){
    $super(onSave, this.name, name, diff);
  }
})
