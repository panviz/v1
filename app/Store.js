/*
 * TODO Replace with DB
 * Storage engine
 * Client: Caches Proxy replies in _local variable
 * Server: Stores records in Array
 */
Class.create("Store", {

  /*
   * @param name Model class name
   * @param uniq Array column names to be uniq
   */
  initialize : function(name, uniq){
    this._model = name;
    this._uniqColumns = uniq || [];
    this._local = [];
  },

  setUniq : function(uniq){
    var names = this._uniqColumns;
    if (Object.isArray(uniq)){
      this._uniqColumns = $A(names.concat(uniq)).compact();
    } else{
      this._uniqColumns.push(uniq);
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
    if (record && record.length < 1) record = false;

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
