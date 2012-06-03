			TODO
	search all TODO notes in code
Xml
	set search bar back
View
	Does View contains Editor? or Editor is a View?
	move action_bar to Main toolbar like Tridion.RibbonToolbar
	open empty Editor if .txt file missing
	open selected file on 'file' action
	Commands are called Actions and are set from html links
Modal and View should implement one Interface with methods: ?
	showDialogForm & _initGUI
	prepareHeader
	title
	clearContent
Editor
	create file on 'save' if missing
	move control buttons to main toolbar
Ajaxplorer
	open hidden default file ".txt" in View on context changed event
FileList
	make a Table view
+	don't show hidden files
Tree Control
	clicking selected node leads in opening default file in View if not already (fire "context changed" event?)


			Notes
DEBUG OPTIONS - bootstrap_context.php
window.
	ajaxplorer
	content_pane -> FilesList klass

Ajaxplorer.klass
	initExtension					//load extension configuration from manifest.xml
	initAjxpWidgets 				//initialization GUI method
		window[ajxpId] = compRegistry[i-1];	//window will contain access to all GUI components classes
	guiCompRegistry 				//array of GUI components
	guiActions 						//Hash
	contextMenu						//Proto.Menu
	actionBar						//ActionsManager
	getUserSelection()				//AjxpDataModel
	getContextNode()				//AjxpNode (current path)
	getContextHolder()				//AjxpDataModel - contains current selection, path, repo

ActionsManager.klass
	actions							//Action.klass

Action.ls

InfoPanel							//Details for file

AjxpNode
	getPath()						//

editor.text TextEditor.klass		//

FilesList
	fill							//fill table with rows
