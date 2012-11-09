/**
 * Templates manager
 */
Class.create("TemplateFul", ReactiveProvider, {
  man: 'gui',
  public: "all",

  initialize : function($super, store){
    $super(store);
    this.store.setUniq("name");
  }
})
