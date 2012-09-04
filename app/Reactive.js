/**
 * Storage mapper
 * Implements instant record update with only two methods:
 *   Get - retrieves data from Remote by uniq identifier "name"
 *   Put - send new, null, or updated record to Remote
 * Abstract class
 */
Class.create("Reactive", {

  initialize : function(store){
    this.store = store || $app.db;
    this.storeName = this.__className.toLowerCase();
  },

  /**
   * Find record in local storage first
   * If item exists - return it (it is definitely up to date)
   * Else load it
   * @param name unique identifier of record
   */
  get : function(callback, name, options){
    var self = this;

    /* @server never enters onLoad
     * @param data 
     */
    var onLoad = function(data){
      // Update local storage if Remote Storage has found the record
      if (data.name){
        self.store.save(onFind, self.storeName, data.name, data);
      } else {
        $modal.error(data);
      }
    }

    var onFind = function(err, data){
      // On missing record
      // Client storage returns null, so request goes to Remote
      // Remote storage throws NotFound Error
      if (data){
        callback(data);
      } else {
        $proxy.send(onLoad, "get", self.storeName, name, options)
      }
    }
    // TODO find by several keys, query chaining, consider options
    // or use uniq id
    this.store.find(onFind, self.storeName, "name", name)
  },

  /**
   * Saves changes locally first then sync with remote
   * @returns Json public difference in record between previous and current
   */
  put : function(callback, name, content, options){
    var self = this;
    if (isServer){
      var onSave = callback;
    } else {
      var onSave = function(diff){
        options = options || {};
        options.content = diff;
        //TODO save data if put returns some
        $proxy.send(callback, "put", self.storeName, name, options)
      }
    }

    return this.store.save(onSave, self.storeName, name, content);
  }
})
