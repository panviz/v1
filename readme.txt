			TODO

EventManagement
	Implement ObjectWithEvent (destroy registered observers on View close)

Check all actions
	stop on root_item_changed

Application

Rename
	access modules -> driver?
	Singleton manager?
		View, Actions, Background, Resources

Item
	remove RemoteItemProvider

View
	move to /view all Panes?
	
View.Editor
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

List or Table
	make inherited from View

Server
	create file on 'save' if missing

	search all TODO notes in code
