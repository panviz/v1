/*
 */
Class.create("Module", ReactiveRecord, {
  
  // @param id full name of module (e.g.: provider.fs)
  update : function($super, p){
    this.id = p.id;
    this.name = p.name;
    this.p = p;

    eval(p.src);
    var moduleClass = Class.getByName(p.man);
    this.man = new moduleClass();
    $super()
  }
})
