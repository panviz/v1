/*
 * TODO Replace with DB
 * Storage engine
 * Client: Caches Proxy replies in _local variable
 * Server: Stores records in Array
 */
Class.create("Store", {

  //TODO add validation and setUniq
  _uniqColumns : ["name"],

  /*
   * TODO create FsStore < Store for Gui (Template)
   * @param name Model class name
   * @param source directory Path for File storage
   */
  initialize : function(name, source){
    this._model = name;
    if (source){
      this._local = $H($util.requireAll(source)).values();
    } else {
      this._local = $A(require(ROOT_PATH + '/data/' + name + '.json'));
    }
  },

  findById : function(onFind, id){
    var idx = id - 1;
    if (this._local[idx]) {
      onFind(this._local[idx]);
    } else {
      onFind(new Error(this._model + id + ' does not exist'));
    }
  },

  find : function(onFind, value, type){
    if (!type) return findById(onFind, value);

    var findFunc = this._uniqColumns.include(type) ? Enumerable.find : Enumerable.findAll;
    var iterator = function(r){ return r[type] == value};
    var record = findFunc.call(this._local, iterator);

    if (record) return onFind(record);
    // Server Storage should return a value
    if (isServer){
      var result = new NotFound(name);
    } else { var result = null}
    onFind(result);
  },

  save : function(name, data){
    Object.extend(this._local[name], data)
  }
})
