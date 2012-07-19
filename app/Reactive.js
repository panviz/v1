/*
 * Implements instant record update with only two methods:
 * Get - retrieves data from Remote by uniq identifier "name"
 * Put - send new, null, or updated record to Remote
 * Is responsible for access restrictions
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
   * @param options may have token - role identifier
   * if token is valid - returns data based on access rights
   * TODO options should specify access level to information based on user role
   */
  get : function(name, options, callback){
    var self = this;

    /* @server never enters onLoad
     * @param data 
     */
    var onLoad = function(data){
      // Update local storage if Remote Storage has found the record
      if (data.name){
        self.store.save(onFind, data.name, data);
      } else {
        $modal.error(data);
      }
    }

    var onFind = function(data){
      // On missing record
      // Client storage returns null, so request goes to Remote
      // Remote storage throws NotFound Error
      if (data){
        // TODO Reduce data by user access level
        //if (options.addressee ){    //how to evaluate data availability?
          //var data = data;
        //} else {
          //var data = self._public.map(function(key){
            //return user[key];
          //})
        //}
        callback(data);
      } else {
        $proxy.get(self.__className.toLowerCase(), name, options, onLoad)
      }
    }
    this.store.find(onFind, name, "name")
  },

  /*
   * Saves changes locally first then sync with remote
   * @returns Json difference in record between previous and current
   */
  put : function(name, content, callback){
    var self = this;

    if (isServer){
      var onSave = callback;
    } else {
      var onSave = function(diff){
        // Do not send if data not changed
        if (diff){
          $proxy.put(self.__className.toLowerCase(), name, diff, callback)
        }else{
          callback()
        }
      }
    }

    return this.store.save(onSave, name, content);
  }
})
