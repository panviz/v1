Class.create("Login", Action, {

  execute : function(){
    var onSubmit = function(formData){
      //TODO encrypt password with seed before sending
      //TODO add captcha if third attempt
      var name = formData.username
      var item = $app.getItemByName(name)
      item.type = 'user';
      var p = {password: formData.password, name: true};
      item.put(null, name, null, p)
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
