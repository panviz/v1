Class.create("ReactiveRecord", Reactive, {
  /**
   * Load record on creation
   * @param String [id]
   * @param Store [store]
   */
  initialize : function($super, id, store){
    $super(store);
    this.toStore = $w('id name type createdAt')
    this.loaded = false;
    // Let initialization chain finish before update
    if (id){
      this.id = id
      setTimeout(this.get.bind(this), 10)
    }
  },

  /**
   */
  get : function($super, options){
    options = options || {}
    var idOrName = options.name ? this.name : this.id
    $super(null, idOrName, options)
  },

  put : function($super, options){
    var idOrName = options.name ? this.name : this.id
    $super(null, idOrName, this._content, options)
  },

  /**
   * On remote record change, Proxy will call this method
   * Augment it in concrete Record class
   * @param Json [diff]
   */
  update : function(data, diff){
    var self = this
    var update = data || diff
    this.toStore.each(function(attr){
      if (update[attr] != undefined){
        if (diff && Object.isArray(update[attr])){
          self[attr] = self[attr].diffMerge(update[attr])
        } else {
          self[attr] = update[attr]
        }
        delete update[attr]
      }
    })
    this.loaded = true;
  },

  save : function(){
    var self = this
    var content = this._content = {}
    this.toStore.each(function(p){
      if (self[p] != undefined) content[p] = self[p]
    })
    this.put()
  }
})
