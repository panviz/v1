Class.create("ActionShowAll", Action, {

  execute : function(){
    this.saved = $item.expand(null, true)
  },

  undo : function(){
    $item.hide(this.saved, false, true)
  }
})
