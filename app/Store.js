/**
 * Storage engine
 * Client: Caches Proxy replies in _local variable
 * Server: Stores records in Memory Array
 */
Class.create("Store", {
  NOT_FOUND: "Not Found",

  initialize : function(){
    this._uniqColumns = [];
    this._local = {};
  },

  setUniq : function(uniq){
    var names = this._uniqColumns;
    if (Object.isArray(uniq)){
      this._uniqColumns = $A(names.concat(uniq)).compact();
    } else{
      this._uniqColumns.push(uniq);
    }
  },

  /**
   * @param type String model name
   * @param id Number
   */
  findById : function(onFind, type, id){
    var idx = id - 1;
    if (this._local[type] && this._local[type][idx]) {
      // as _local is in memory for now, return clone object, not reference
      onFind(Object.clone(this._local[type][idx]));
    } else {
      onFind(null, this.NOT_FOUND);
    }
  },

  /**
   * @param type String model name
   * @param key String property name
   * @param value String value to search records by
   * @returns Json record
   */
  find : function(onFind, type, key, value){
    if (!this._local[type]) return onFind(null, this.NOT_FOUND)

    // find all records with key property
    if (Object.isBoolean(value)){
      var findFunc = Enumerable.findAll;
      var iterator = function(r){ return !!r[key]};
    } else {
      if (!key || key == "id") return this.findById(onFind, value);
      var findFunc = this._uniqColumns.include(key) ? Enumerable.find : Enumerable.findAll;
      var iterator = function(r){ return r[key] == value};
    }
    var record = findFunc.call(this._local[type], iterator);
    if (record && record.length < 1) record = false;

    if (!record && isServer){
      onFind(null, this.NOT_FOUND);
    } else {
      // as _local is in memory for now, return clone object, not reference
      onFind(Object.clone(record));
    }
  },

  /**
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, name, diff){
    if (!this._local[type]) this._local[type] = [];
    var s = this._local[type];
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
          this._local[type] = s.without(s[i]);
        }
      }
    }
    onSave(diff);
    return diff;
  }
})
