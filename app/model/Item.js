/**
 * Abstract container for data
 */
Class.create("Item", ReactiveRecord, {

  /**
   * @param name String
   * @param p JSON optional params
   */
  initialize : function($super, name, p){
    $super(name);
    var p = p || {};
    this.label = p.label || name;
    this.icon = p.icon;
    //TODO what format of links?
    this.links = p.links;
  },

  _update : function($super, data){
    debugger
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
  }
});
