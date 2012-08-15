/**
 * TODO remove this class
 * Stores data in provided Hash
 */
Class.create("StoreHash", {

  /**
   * @param name Model class name
   * @param hash where to store
   */
  initialize : function(name, hash){
    this._model = name;
    this._local = hash;
  },

  /**
   * @param type String column name
   * @param key String key to search records by
   * @returns Class
   */
  find : function(onFind, key){
    onFind(this._local[key]);
  },

  /**
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, name, code){
    var s = this._local;
    // Update
    if (name && code){
      var record = s[name] = eval(code);
    }
    // Remove
    else{
      if (s[name]){
       delete s[name];
      }
    }
    onSave(record);
    return record;
  }
})
