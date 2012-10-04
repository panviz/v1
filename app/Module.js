/**
 */
Class.create("Module", ReactiveRecord, {
  
  _update : function($super, p){
    Object.extend(this, p);

    // Add class to global scope
    eval(p.src);
    this.man = p.man;
    $super(p)
  }
})
