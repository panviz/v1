/*
 * Description Manages views of application
 */
Class.create("ViewManager", {
	initialize : function()
	{
		this._views = $H();
		this._current = null;
		this.modal = new Modal();
		//TODO change event for editor start
		document.observeOnce("app:component_config_changed", function(event){
			$$(".view").each(function(element){
				//TODO mime should be set into editors data while xml parsing
				var mime = element.getAttribute("default_mime")
				var editors = app.findEditorsForMime(mime);
				if(editors.length && editors[0].openable){
					var data = editors[0];
					data.mime = mime;
					this._createEditor(element, data);
				}
			}.bind(this));
		}.bind(this) );
	},

	setCurrentView : function(view)
	{
		this._current = view;
	},

	/**
	 * Returns the current view.
	 */
	getView : function(){
		return this._current;
	},
	/**
	 * Find an editor using the data and initialize it
	 * @param data Object
	 */
	_createEditor : function(element, data){
		if(data){
			app.loadEditorResources(data.resourcesManager);
			if(!data.formId){
				app.displayMessage('ERROR', 'Error, you must define a formId attribute in your &lt;editor&gt; manifest (or set it as openable="false")');
				return;
			}
			var editorClass = data.editorClass;
			var view;
			if(typeof(editorClass) == "string"){
				view = eval('new '+editorClass+'(element, data)');
			}else{
				view = new editorClass(element, data);
			}
			this._views.set(element.id, view);
			if (element.id == "main_view"){
				this.setCurrentView(view);
			}
		}
	}
});

var $display = new ViewManager();
var modal = $display.modal;
