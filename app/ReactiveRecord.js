/**
 * On initialize Record binds its _update method on message from Remote
 * In such way this Record will be always updated on any remote change
 */
Class.create("ReactiveRecord", Reactive, {

  // Load record on creation
  initialize : function($super, name, store){
    $super(store);
    this.toStore = $w('name type')
    if (Object.isString(name)) this.name = name;
    if (Object.isNumber(name)) this.id = name;
    this.loaded = false;
    // Let initialization chain finish before update
    if (name) setTimeout(this.get.bind(this, null, name), 10)
  },

  // augment in Record class
  update : function(p){
    var self = this
    if (p.id) this.id = p.id
    this.toStore.each(function(attr){
      //TODO what if server has deleted attr?
      if (p[attr]){
        self[attr] = p[attr]
        delete p[attr]
      }
    })
    this.loaded = true;
  },

  save : function(){
    var self = this
    var content = {}
    this.toStore.each(function(p){
      if (self[p] != undefined) content[p] = self[p]
    })
    this.put(null, this.id, content)
  }
})
