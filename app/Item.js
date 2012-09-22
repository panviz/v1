/**
 * Abstract container for data
 */
Class.create("Item", ReactiveRecord, {

  /**
   * @param name String
   * @param p JSON optional params
   */
  initialize : function($super, name, p){
    this.__defineGetter__("size", function(){
      return this.children ? this.children.length : 0;
    })

    $super(name);
    var p = p || {};
    this.label = p.label || name;
    this.icon = p.icon;
    //TODO what format of links?
    this.links = p.links;
  },

  _update : function($super, data){
    $super();
    document.fire('app:context_changed');
  },

  /**
   * if this Item is linked with given item
   * @param item Item
   * @returns Boolean
   */
  hasLink : function(item){
    //TODO
  },

  /**
   * @param type String limit links to certain type if specified
   * @returns Array all directly linked items
   */
  links : function(type){
  },

  /**
   * @returns Array all "parent" items
   */
  incoming : function(type){
  },

  /**
   * @returns Array all "child" items
   */
  outgoing : function(type){
  }

});
