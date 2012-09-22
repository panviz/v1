/**
 * Reactive Provider
 */
Class.create("ReactiveProvider", Reactive, {

  initialize : function($super){
    // created managed instances
    this._instances = new Hash();
    $super.apply(this, $A(arguments).slice(1, arguments.length));
  },

  /**
   * Get created instance from local Hash
   * @param name String uniq id
   */
  getSync : function(name){
    return this._instances.get(name);
  }
})
