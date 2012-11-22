/**
 * Control for users action: login, logout, signup
 */
Class.create("UserStatus", {

	initialize : function(p){
    var action = this.action = $act.get("ActionLogin");
    this.loginButton = Ext.create('Ext.Button', {
      text: t["Login"]
    , scale: p.buttonSize
    , handler: action.apply
    , scope: action
    });
		this.signupButton = Ext.create('Ext.Button', {
			text: t["Sign Up"]
    , scale: p.buttonSize
    })
		this.logoutButton = Ext.create('Ext.Button', {
			text: t["Logout"]
    , scale: p.buttonSize
    , handler: action.undo
    , scope: action
    })

    this.extControls = [this.loginButton, this.signupButton, this.logoutButton];
  }
})
