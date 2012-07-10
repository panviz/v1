/**
 * Control for users action: login, logout, signup
 */
Class.create("UserStatus", {

	initialize: function(p){
		this.logoutButton = Ext.create('Ext.Button', {
			text: "Logout",
			scale: p.size,
			handler: function() {
        alert('TODO imlement Logout!');
      }
    });
    this.loginButton = Ext.create('Ext.Button', {
      text: "Login",
      scale: p.size,
      handler: function() {
        alert('TODO imlement Login!');
      }
    });

    this.extControls = [this.loginButton, this.logoutButton];
  }
})
