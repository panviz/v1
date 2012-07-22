Class.create("Login", Action, {

  execute : function(){
    var onLoad = function(template){
      var onSubmit = function(formData){
        //TODO encrypt password with seed before sending
        //TODO add remember_me option
        //TODO add captcha if third attempt
        var user = new User(formData.username, formData.password);
      }
      //TODO addListener on "user:auth" event
      var onAuth = function(user){
        $user.setCurrentUser(user);
      }

      //items of Login panel
      // Specific attributes for the text fields for username / password. 
      // The "name" attribute defines the name of variables sent to the server.
      onClickReset = function() {
          this.up('form').getForm().reset();
      };
      onClickSubmit = function(){
        var form = this.up('form').getForm();
        if (form.isValid()){
          onSubmit(form.getValues());
        }
      }
      var loginForm = Ext.create('Ext.form.Panel', template);

      var buttonsToolbar = loginForm.getDockedItems()[0];
      var resetBtn = buttonsToolbar.getComponent('reset');
      var submitBtn = buttonsToolbar.getComponent('submit');
      resetBtn.on('click', onClickReset);
      submitBtn.on('click', onClickSubmit);
      
      var size = {width: 300, height: 140}
      var title = "Please, login";
      $modal.show(loginForm, size, title)
    }

    $gui.get(onLoad, 'loginForm');
  },

  /*
   * Logout
   */
  undo : function(){
    var onServerConfirm = function(user){
      $user.setCurrentUser(null);
    }
  }
});
