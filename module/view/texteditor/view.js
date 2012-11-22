Class.create("ViewTexteditor", View, {
  // Item shown in Editor
  item: null,

	initialize : function($super, p){
		$super(p);

    p.frame = true
    p.layout = "fit"
    var control = this.control = Ext.create('Ext.panel.Panel', p);

    Ext.tip.QuickTipManager.init()  // enable tooltips
    this.editor = Ext.create('Ext.form.HtmlEditor', {
    })
    this.editor.on('change', this._onEdit.bind(this))
    //this.editor.on('beforedeactivate', this._setItemContent.bind(this))
    this.control.add(this.editor)
    this.extControls.push(this.control)
    if ($user) this._onContextChanged({memo: $user.context})
	},
	
  //TODO verify user write access or suggest making a copy
  _onContextChanged : function(e){
    var item = this.item = e.memo
    var editor = this.editor
    if (item.type != 'text') return this.editor.hide()
    editor.show()
    editor.suspendEvents()
    editor.setValue(item.content)
    editor.resumeEvents()
	},

  _onEdit : function(editor, value){
    this.item.content = value
    if (!this.item.changed) this.item.change()
  },
	
  //TODO what if file content is big and wouldn't fit localStorage size?
	//loadFileContent : function(fileName){},
	
  //_setItemContent : function(a,b,c){
    //debugger
    //this.item.content = ''
  //},

	clearContent : function(){
		this.textarea.innerHTML = ''
	}
})
