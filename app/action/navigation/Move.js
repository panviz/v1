Class.create("ActionMove", Action, {

  initialize : function($super){
    $super()
    this.p.accessKey = ['Up', 'Down', 'Left', 'Right']
  },

  execute : function(){
  }
})
