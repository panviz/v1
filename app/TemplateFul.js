/**
 * Templates manager
 */
Class.create("TemplateFul", Reactive, {
  public : "all",
  initialize : function($super, store){
    $super(store);
    this.store.setUniq("name");
  }
})
