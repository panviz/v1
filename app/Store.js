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
   * @param String type model name
   * @param Number id
   */
  findById : function(onFind, type, id){
    var s = this._local[type];
    if (s){
      for (var i=0; i< s.length; i++){
        if (s[i].id == id){
          // as _local is in memory for now, return clone object, not reference
          return onFind(Object.clone(s[i], true));
        }
      }
    }
    onFind(null, this.NOT_FOUND);
  },
  /**
   * @param String type model name
   * @param String key property name
   * @param String [value] to search records by
   * Find all if missing
   * @returns Json record
   */
  find : function(onFind, type, key, value){
    if (!this._local[type]) return onFind(null, this.NOT_FOUND)
    if (key == "id") return this.findById(onFind, type, value);

    // find all records with key property
    if (!value){
      var findFunc = Enumerable.findAll;
      var iterator = function(r){ return !!r[key]};
    } else {
      var findFunc = this._uniqColumns.include(key) ? Enumerable.find : Enumerable.findAll;
      var iterator = function(r){ return r[key] == value};
    }
    var record = findFunc.call(this._local[type], iterator);
    if (record && record.length < 1) record = false;

    if (!record && isServer){
      onFind(null, this.NOT_FOUND);
    } else {
      // as _local is in memory for now, return clone object, not reference
      onFind(Object.clone(record, true));
    }
  },
  /**
   * Create, Update & Delete
   * @param Function onSave callback called with Json difference in record between previous and current
   * @param String type Item type
   * @param String id record id to be updated or name of new one
   * @param Json update diff or full record data to save into the record
   * @returns Diff 
   * update.property:
   * null      - empty value
   * undefined - don't update
   * false     - remove property
   */
  //TODO update should be diff too
  save : function(onSave, type, id, update){
    var diff
    if (!this._local[type]) this._local[type] = [];
    var s = this._local[type];
    // Update or Create
    if (update){
      var previous
      for (var i=0; i < s.length; i++){
        if (s[i].id == id){
         previous = $H(s[i]); break;
        }
      }
      var current = $H(update);
      if (type == 'gui' || type == 'module'){
        diff = update
        previous ? s[i] = update : s.push(update)
      } else{
        diff = (previous || $H()).diff(current)
        var updated = (previous || $H()).diffMerge(diff).toJSON()
        previous ? s[i] = updated : s.push(updated)
      }
    }
    // Remove
    else if (update != undefined){
      for (var i=0; i < s.length; i++){
        if (s[i].id == id){
          this._local[type] = s.without(s[i]);
        }
      }
    }
    onSave(Object.clone(diff, true));
  }
})
