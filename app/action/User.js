Class.create("Login", Action, {

  execute : function(){
    var onLoad = function(template){
      var onSubmit = function(formData){
        var user = new User(formData.username, formData.password);
      }
      //TODO addListener on user:auth event
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

    $gui.get('loginForm', {}, onLoad);
  },

  old : function(){
    var loginRedirect = AJXP_LOGIN_REDIRECT;
    if(loginRedirect){
      document.location.href=loginRedirect;
    }else{
      $modal.showDialogForm('Log In', ($('login_form')?'login_form':'login_form_dynamic'), 
      function(oForm){
          if(bootstrap.parameters.get("customWording")){
                          var ttSt = $("generic_dialog_box").down("span.titleString");
                          ttSt.innerHTML = ttSt.innerHTML.replace("AjaXplorer", bootstrap.parameters.get("customWording").title );
          }
        application.loadSeedOrCaptcha(oForm.down('#login_seed'), oForm.down('img#captcha_image'), oForm.down('div.dialogLegend'), 'before');
        if(Prototype.Browser.IE && !Modernizr.borderradius && !oForm.down('input[type="text"]').key_enter_attached){
          oForm.select('input').invoke("observe", "keydown", function(event){
            if(event.keyCode == Event.KEY_RETURN){
              var el = Event.findElement(event);
              if(el.hasClassName('dialogButton')){
                el.click();
              }else{
                el.form.down('input.dialogButton').click();
              }
            }
          });
          oForm.down('input[type="text"]').key_enter_attached = true;
        }
      }, 
      function(){
        var oForm = $modal.getForm();
        var connection = new Connection();
        connection.addParameter('get_action', 'login');
        connection.addParameter('userid', oForm.userid.value);
        connection.addParameter('login_seed', oForm.login_seed.value);
        connection.addParameter('remember_me', (oForm.remember_me.checked?"true":"false"));
        if(oForm.login_seed.value != '-1'){
          connection.addParameter('password', hex_md5(hex_md5(oForm.password.value)+oForm.login_seed.value));
        }else{
          connection.addParameter('password', oForm.password.value);
        }
        if(oForm.captcha_code){
          connection.addParameter('captcha_code', oForm.captcha_code.value);
        }
        connection.onComplete = function(transport){
          application.actionBar.parseXmlMessage(transport.responseXML);
          if(transport.responseXML && XPathGetSingleNodeText(transport.responseXML.documentElement, "logging_result/@value") == "-4"){
            application.loadSeedOrCaptcha(oForm.down('#login_seed'), oForm.down('img#captcha_image'), oForm.down('div.dialogLegend'), 'before');
          }
        };
        connection.setMethod('put');
        connection.sendAsync();
        oForm.userid.value = '';
        oForm.password.value = '';
        return false;				
      });
    }
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
