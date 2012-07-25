Class.create("SQLSearchEngine", SearchEngine, {
	
	initGUI:function(){
		this.htmlElement.update('<div style="font-style:italic;color:#999;margin-top:5px;">'+I18N["sql.2"]+'</div><textarea id="sql_query" style="width:100%; overflow:auto;"></textarea><div class="dialogButtons"><img height="16" width="16" id="search_button" value="Search" style="margin-top:5px;cursor:pointer;" src="'+ajxpResourcesFolder+'/images/action/16/search.png" title="'+I18N["sql.3"]+'"/> <img height="16" width="16" id="clear_button" value="Clear" style="margin-top:5px;cursor:pointer;margin-right:5px;" src="'+ajxpResourcesFolder+'/images/actions/16/fileclose.png" title="'+I18N["sql.4"]+'"/></div>');
		this.sqlQuery = $('sql_query');
		
		this.sqlQuery.observe("focus", function(e){
			app.disableShortcuts();
			this.hasFocus = true;
			//this.sqlQuery.select();
			Event.stop(e);
		}.bind(this));
		this.sqlQuery.observe("blur", function(e){
			app.enableShortcuts();
			this.hasFocus = false;
		}.bind(this) );
		this.sqlQuery.observe("keydown", function(e){
			if(e.keyCode == Event.KEY_RETURN && e["ctrlKey"]){
				this.performSearch(this.sqlQuery.getValue());
				Event.stop(e);
			}
		}.bind(this));

		this.searchButton = $('search_button');
		this.searchButton.observe('click', function(e){
			this.performSearch(this.sqlQuery.getValue());
		}.bind(this));
		this.clearButton = $('clear_button');
		this.clearButton.observe('click', function(e){
			this.sqlQuery.update("");
			this.sqlQuery.value = "";
		}.bind(this));
		
		this.resize();
	},
	
	performSearch:function(query){
		if(query == '') return;
		var connection = new Connexion();
		var params = new Hash();
		params.set('get_action', 'set_query');
		params.set('query', query);
		connection.setParameters(params);
		var res = connection.sendSync();
		var path = "/ajxpmysqldriver_searchresults";
		app.updateContextData(new Item(path));
	},
	
	resize:function(){
		fitHeightToBottom(this.sqlQuery, null, 27);
	},
	
	focus:function(){
		if(this.htmlElement.visible()){
			this.sqlQuery.focus();
			this.hasFocus = true;
		}		
	},
	
	blur: function(){
		this.sqlQuery.blur();
		this.hasFocus = false;
	}
});
