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
    if (!this.type) this.type = this.__className.toLowerCase();
  },

  /**
   * Find record in local storage first
   * If item exists - return it (it is definitely up to date)
   * Else load it
   * @param name unique identifier of record
   */
  get : function(callback, name, options){
    var self = this;

    var onFind = function(data, err){
      if (isServer){
        if (data && options && options.depth && options.depth > 0){
          var cb = function(children){
            if (children){
              data.children = children;
              callback(data);
            } else {callback(data)}
          }
          self.store.getLinked(cb, data.id, options.depth);
        } else{
          callback(data, err);
        }
      } else {
        if (data){
          callback(data)
        } else {
          $proxy.send(self._onLoad.bind(self, onFind), "get", self.type, name, options)
        }
      }
    }
    // TODO find by several keys, query chaining, consider options
    // or use uniq id
    this.store.find(onFind, this.type, "name", name)
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
        $proxy.send(self._onLoad.bind(self, callback), "put", self.type, name, options)
      }
    }

    return this.store.save(onSave, this.type, name, content);
  },

  //@client
  _onLoad : function(cb, data){
    // Update local storage if Remote Storage has found the record
    if (data.name){
      this.store.save(cb, this.type, data.name, data);
    } else {
      $modal.error(data);
    }
  }
})
