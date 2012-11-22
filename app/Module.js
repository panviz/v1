Class.create("Module", {
  
  initialize : function(p){
    Object.extend(this, p);

    // Add class to global scope
    if (p.src) p.src.each(function(src){eval(src)})
    if (p.actions) $act.register(p.actions)
    delete p.src
    this.man = p.man;
  }
})
