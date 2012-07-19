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

  /*
   * @param id Number
   */
  findById : function(onFind, id){
    var idx = id - 1;
    if (this._local[idx]) {
      onFind(this._local[idx]);
    } else {
      onFind(new Error(this._model + id + ' does not exist'));
    }
  },

  /*
   * @param type String column name
   * @param key String key to search records by
   * @returns Json record
   */
  find : function(onFind, key, type){
    if (!type) return findById(onFind, key);

    var findFunc = this._uniqColumns.include(type) ? Enumerable.find : Enumerable.findAll;
    var iterator = function(r){ return r[type] == key};
    var record = findFunc.call(this._local, iterator);

    if (!record && isServer){
      throw NotFound(key);
    }
    onFind(record);
  },

  /*
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, name, diff){
    var s = this._local;
    var previous;
    for (var i=0; i < s.length; i++){
      if (s[i].name == name){
       previous = $H(s[i]).clone(); break;
      }
    }

    if (previous){
      //TODO delete property from object in store if it is empty in diff
      s[i] = Object.extend(s[i], diff)
      var current = $H(s[i]);

      var diff = previous.diff(current);
    } else {
      s.push(diff)
    }
    onSave(diff);
    return diff;
  }
})
