Class.create("ActionLogin", Action, {

  execute : function(){
    var onSubmit = function(formData){
      //TODO encrypt password with seed before sending
      //TODO add captcha if third attempt
      var name = formData.username
      var item = $app.getItemByName(name)
      item.type = item.man = 'user';
      item.name = name
      var p = {password: formData.password, name: true};
      item.put(p)
    }
    var got = function(control){
      control.setOnSubmit(onSubmit);
      $modal.show(control.control, control.size, control.title);
      document.observe("user:auth", $modal.hide.bind($modal))
    }

    $gui.getInstance(got, 'loginForm');
  },
  /**
   * Logout
   */
  undo : function(){
    //TODO
    var onServerConfirm = function(user){
      $user = null
    }
  }
});
