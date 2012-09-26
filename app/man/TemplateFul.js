/**
 * Templates manager
 */
Class.create("TemplateFul", ReactiveProvider, {
  type: 'gui',
  public: "all",

  initialize : function($super, store){
    $super(store);
    this.store.setUniq("name");
  }
})
