Class.create("Login", Action, {

  execute : function(){
    var onSubmit = function(formData){
      //TODO encrypt password with seed before sending
      //TODO add captcha if third attempt
      var name = formData.username
      var item = $app.createItem()
      item.type = 'user';
      var p = {password: formData.password};
      item.put(item._update.bind(item), name, null, p)
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
      $user.setCurrentUser(null);
    }
  }
});
