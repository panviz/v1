/*
 * Implements instant record update with only two methods:
 * Get - retrieves data from Remote by uniq identifier "name"
 * Put - send new, null, or updated record to Remote
 * Storage mapper
 */
Class.create("Reactive", {

  initialize : function(store){
    this.store = store || $orm.getStorage(this.__className);
  },

  /*
   * Find record in local storage first
   * if name only specified - returns record's public representation
   * @param name unique identifier of record
   * @param p may have token - role identifier
   * if token is valid - returns data based on access rights
   */
  get : function(name, p, callback){
    var onLoad = function(data){

      // Update local storage if Remote Storage has found the record
      if (data.name){
        this.store.save(data.name, data.data);
        onFind(data);
      } else {
        $modal.error(data);
      }
    }
    var onFind = function(data){

      // On missing record
      // Client storage returns null, so request goes to Remote
      // Remote storage return NotFound Error
      if (data){
        callback(data);
      } else {
        $proxy.get(this.__className.toLowerCase(), name, p, onLoad.bind(this))
      }
    }
    this.store.find(onFind.bind(this), name, "name")
  },

  /*
   * Saves changes locally first then sync with remote
   */
  put : function(name, p, callback){
    var onLoad = function(data){
      // Update local storage
      this.store.save(data.name, data.data);
      callback(data);
    }
    $proxy.put(this.__className.toLowerCase(), name, p, onLoad.bind(this))
  }
})
