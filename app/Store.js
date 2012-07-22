/*
 * TODO Replace with DB
 * Storage engine
 * Client: Caches Proxy replies in _local variable
 * Server: Stores records in Array
 */
Class.create("Store", {

  //TODO add validation and setUniq
  _uniqColumns : ["name", "SECURE_TOKEN"],

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
      // as _local is in memory for now, return clone object, not reference
      onFind(Object.clone(this._local[idx]));
    } else {
      throw("Not Found");//NotFound(id);
    }
  },

  /*
   * @param type String column name
   * @param key String key to search records by
   * @returns Json record
   */
  find : function(onFind, key, type){
    if (!type || type == "id") return this.findById(onFind, key);

    var findFunc = this._uniqColumns.include(type) ? Enumerable.find : Enumerable.findAll;
    var iterator = function(r){ return r[type] == key};
    var record = findFunc.call(this._local, iterator);

    if (!record && isServer){
      throw("Not Found");//NotFound(key);
    }
    // as _local is in memory for now, return clone object, not reference
    onFind(Object.clone(record));
  },

  /*
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, name, diff){
    var s = this._local;
    var previous;
    if (diff){
      for (var i=0; i < s.length; i++){
        if (s[i].name == name){
         previous = $H(s[i]).clone(); break;
        }
      }
      // Update
      if (previous){
        //TODO delete property from object in store if it is empty in diff
        s[i] = Object.extend(s[i], diff)
        var current = $H(s[i]);
        var diff = previous.diff(current);
      }
      // Create
      else {
        diff.name = name;
        s.push(diff);
      }
    }
    // Remove
    else{
      for (var i=0; i < s.length; i++){
        if (s[i].name == name){
         delete s[i];
        }
      }
    }
    onSave(diff);
    return diff;
  }
})
