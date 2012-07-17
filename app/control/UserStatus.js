/**
 * Control for users action: login, logout, signup
 */
Class.create("UserStatus", {

	initialize: function(p){
    var action = $act.get("loginAction");
    this.loginButton = Ext.create('Ext.Button', {
      text: "Login",
			scale: p.buttonSize,
      handler: function(){
        action.execute;
      }
    });
		this.logoutButton = Ext.create('Ext.Button', {
			text: "Logout",
			scale: p.buttonSize,
			handler: function(){
        action.undo;
      }
    });

    this.extControls = [this.loginButton, this.logoutButton];
  }
})
