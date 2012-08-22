/**
 */
Class.create("Module", ReactiveRecord, {
  
  _update : function($super, p){
    this.p = p;

    eval(p.src);
    var moduleClass = Class.getByName(p.man);
    this.man = new moduleClass();
    $super()
  }
})
