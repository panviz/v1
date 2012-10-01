/**
 * Control for users action: login, logout, signup
 */
Class.create("UserStatus", {

	initialize : function(p){
    var action = this.action = new Login({});//$act.get("loginAction");
    this.loginButton = Ext.create('Ext.Button', {
      text: t["Login"],
			scale: p.buttonSize,
      handler: action.execute
    });
		this.signupButton = Ext.create('Ext.Button', {
			text: t["Sign Up"],
			scale: p.buttonSize
    });
		this.logoutButton = Ext.create('Ext.Button', {
			text: t["Logout"],
			scale: p.buttonSize,
			handler: function(){
        action.undo;
      }
    });

    this.extControls = [this.loginButton, this.logoutButton];
  }
})
