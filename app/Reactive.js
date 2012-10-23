/**
 * Storage mapper
 * Implements instant record update with only two methods:
 *   Get - retrieves data from Remote by uniq identifier
 *   Put - send new, null, or updated record to Remote
 * Abstract class
 */
Class.create("Reactive", {

  initialize : function(store){
    this.store = store || $app.db;
    if (this.type === undefined) this.type = this.__className.toLowerCase();
  },
  /**
   * Find record in local storage first
   * If item exists - return it (it is definitely up to date)
   * Else load it
   * @param Json options
   * @param {Number|String} idOrName unique identifier of record
   * @returns Json data of the record
   */
  get : function(got, idOrName, options){
    var self = this;
    got = got || this.update.bind(this)
    options = options || {};
    var onFind = function(data, err){
      if (isServer || (data && !options.force)){
        got(data, err)
      } else {
        delete options.force
        options.SECURE_TOKEN = SECURE_TOKEN;
        $proxy.send("get", self.type, idOrName, options)
      }
    }
    // TODO find by several keys, query chaining, consider options
    // or use uniq id
    var key = Object.isNumber(idOrName) ? "id" : "name"
    this.store.find(onFind, this.type, key, idOrName)
  },
  /**
   * Saves changes locally first then sync with remote
   * @param Function callback
   * @param Json options
   * @param Json content
   * @param {Number|String} idOrName name used when sending new record
   * @returns Json public difference in record between previous and current
   */
  put : function(callback, idOrName, content, options){
    var self = this;
    if (isServer){
      var onSave = callback;
    } else {
      var onSave = function(diff){
        options = options || {};
        options.content = diff;
        options.SECURE_TOKEN = SECURE_TOKEN;
        $proxy.send("put", self.type, idOrName, options)
      }
    }
    return this.store.save(onSave, this.type, idOrName, content);
  },

  //@client
  onLoad : function(data){
    var self = this;
    var onSave = function(data){
      self.update(data);
    }
    var idOrName = this.id >= 0 ? this.id : data.name
    // Update local storage
    this.store.save(onSave, this.type, idOrName, data);
  },

  //implement in child class
  update : function(){
    logger.error("Update method is not implemented")
  }
})
