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
   * @returns Class instantiated record
   */
  getInstance : function(got, name, options){
    var self = this;
    var instance = this._instances.get(name)
    if (instance){
      got(instance)
    } else {
      var cb = function(data){
        var instance = self.instance(data);
        self._instances.set(name, instance);
        got(instance)
      }
      this.get(cb, name, options)
    }
  },

  /**
   * @param data Json
   * @returns Class instantiated record
   */
  instance : function(data){
  },

  /**
   * TODO Deprecated
   * Get created instance from memory Hash
   * @param name String uniq id
   */
  getSync : function(name){
    return this._instances.get(name);
  }
})
