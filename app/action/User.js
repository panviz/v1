Class.create("Login", Action, {

  execute : function(){
    var onLoad = function(template){
      var onSubmit = function(formData){
        //TODO encrypt password with seed before sending
        //TODO add remember_me option
        //TODO add captcha if third attempt
        new User(formData.username, formData.password);
      }

      //items of Login panel
      // Specific attributes for the text fields for username / password. 
      // The "name" attribute defines the name of variables sent to the server.
      var onClickReset = function() {
          loginForm.getForm().reset();
      };
      var onClickSubmit = function(){
        var form = loginForm.getForm();
        if (form.isValid()){
          onSubmit(form.getValues());
        }
      }
      var focusFirstField = function(){
        usernameField.focus('', 100);
      }
      var submitOnEnter = function(field, e){
        if (e.getKey() == e.ENTER){
          onClickSubmit();
        }
      }

      template.items[0].fieldLabel = t('Username');
      template.items[1].fieldLabel = t('Password');
      template.buttons[0].text = t('Reset');
      template.buttons[1].text = t('Submit');
      var loginForm = Ext.create('Ext.form.Panel', template);
      var usernameField = loginForm.getComponent("username");
      var passwordField = loginForm.getComponent("password");
      loginForm.on('afterrender', focusFirstField);
      passwordField.on('specialkey', submitOnEnter);
      usernameField.on('specialkey', submitOnEnter);

      var buttonsToolbar = loginForm.getDockedItems()[0];
      var resetBtn = buttonsToolbar.getComponent('reset');
      var submitBtn = buttonsToolbar.getComponent('submit');
      resetBtn.on('click', onClickReset);
      submitBtn.on('click', onClickSubmit);
      
      var size = {width: 300, height: 140};
      var title = t["Enter login/password"];
      $modal.show(loginForm, size, title);
      document.observe("user:auth", $modal.hide.bind($modal))
    }

    $gui.get(onLoad, 'loginForm');
  },

  /**
   * Logout
   */
  undo : function(){
    var onServerConfirm = function(user){
      $user.setCurrentUser(null);
    }
  }
});
