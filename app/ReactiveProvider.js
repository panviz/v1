/**
 * Reactive Provider
 */
Class.create("ReactiveProvider", Reactive, {

  // created managed instances
  _instances : new Hash(),

  /**
   * Get created instance from local Hash
   * @param name String uniq id
   */
  getSync : function(name){
    return this._instances.get(name);
  }
})
