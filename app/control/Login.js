Class.create("ControlLogin", {

  initialize : function(template){
    this.size = {width: template.width, height: template.height};
    this.title = t[template.title];
    //TODO add remember_me option

    var onClickReset = function() {
      control.getForm().reset();
    };
    var focusFirstField = function(){
      usernameField.focus('', 100);
    }

    template.items[0].fieldLabel = t('Username');
    template.items[1].fieldLabel = t('Password');
    template.buttons[0].text = t('Reset');
    template.buttons[1].text = t('Submit');
    var control = this.control = Ext.create('Ext.form.Panel', template);
    var usernameField = this.usernameField = control.getComponent("username");
    var passwordField = this.passwordField = control.getComponent("password");
    control.on('afterrender', focusFirstField);

    var buttonsToolbar = control.getDockedItems()[0];
    var resetBtn = buttonsToolbar.getComponent('reset');
    this.submitBtn = buttonsToolbar.getComponent('submit');
    resetBtn.on('click', onClickReset);

    this.extControls = [control];
  },

  setOnSubmit : function(f){
    var form = this.control.getForm();
    var onSubmit = function(){
      if (form.isValid()){
        f(form.getValues());
      }
    }
    var submitOnEnter = function(field, e){
      if (e.getKey() == e.ENTER){
        onSubmit();
      }
    }
    this.submitBtn.on('click', onSubmit);
    this.passwordField.on('specialkey', submitOnEnter);
    this.usernameField.on('specialkey', submitOnEnter);
  }
})
