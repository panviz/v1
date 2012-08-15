/* @server
 * Imlements Store model for modules in /module path
 */
Class.create("StoreModule", Store, {

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
   * @param name Model class name
   * @param source directory Path for File storage
   */
  initialize : function($super, toInit){
    $super("Module");
    var self = this;

    toInit.forEach(function(id){
      self._local.push(self.initModule(id));
    })
  },

  // @param id full name of module (e.g.: provider.fs)
  initModule : function(id){
    var m = {};
    // to be uniq in store name is id now
    m.name = id;
    m.type = id.split('.')[0];
    var path = {};
    var root = path.root = ROOT_PATH + this._root + '/' + id.replace('.','/');
    
    //Change paths to absolute
    $H(this._path).each(function(el){
      path[el.key] = root + el.value;
    })
    var config = m.config = require(path.config);
    m.i18n = $util.requireAll(path.i18n);
    var manPath = path.root + '/' + m.type + '.js';

    m.src = fs.readFileSync(manPath, 'binary');
    m.man = m.type.capitalize() + m.config.name.capitalize();
    //TODO add dependent files

    return m;
  }
})
