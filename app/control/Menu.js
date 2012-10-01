/**
 * Control for users action: Save
 */
Class.create("MainMenu", {

	initialize : function(p){
    var action = this.action = new ActionSave({})
    this.saveButton = Ext.create('Ext.Button', {
      text: t("Save"),
			scale: p.buttonSize,
      handler: action.execute
    });

    this.extControls = [this.saveButton];
  }
})
