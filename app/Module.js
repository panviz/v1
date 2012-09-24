/**
 */
Class.create("Module", ReactiveRecord, {
  
  _update : function($super, p){
    this.p = p;

    eval(p.src);
    this.man = p.man;
    $super()
  }
})
