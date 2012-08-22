/**
 * Templates manager
 */
Class.create("TemplateFul", ReactiveProvider, {
  public : "all",

  initialize : function($super, store){
    $super(store);
    this.store.setUniq("name");
  }
})
