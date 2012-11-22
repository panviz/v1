Class.create("ActionDelete", Action, {

  execute : function(){
    $item.selection.each(function(item){
      item.remove()
    })
  }
})
