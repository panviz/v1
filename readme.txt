      TODO

Graph View
  Mark as Changed on move, edit, link
    Nodes - colored circumference
    View - colored title
  Save nodes positions on move localy
  Store nodes positions on Ctrl+s & on time interval (autosave) at server
  Show nodes properties
  Actions
    Edit
    Create
    Delete
    Hide
    Merge
  Bound shown nodes to visible area

View
  draw User Node on context_changed
  draw modules nodes as fake nodes

Client

Server
  Js files buncher & minifier
    Remove code in 'isServer' blocks
    Remove methods with @server comment
  add path helpers
  create item on 'save' if missing

EventManagement
  Implement ObjectWithEvent (destroy registered observers on View close)
  OR extend prototype to add events on Object

Item

Modal
  should implement one Interface with View?

Other
  replace store.setUniq with index
  Make tests for Core classes
  

  ------------- Minor
Revise
  server/exception.js
  FormManager
  BackgroundManager
  Model
  ActivityMonitor

check all methods and variables Privacy
search all TODO notes in code

Module
  Modules can be dependent on others
    provider.dropbox -> fs
    bookmark -> persistent storage like fs, mysql, mongo
    git -> svc
    fb, vk -> social as provider of several item types: contact, message,
    image, etc
  View.Editor
    Does View contains Editor? or Editor is a View?
    move action_bar to Main toolbar like Tridion.RibbonToolbar
    open empty Editor if .txt file missing
    open selected item on 'item' action

  
Prototype
  fully replace prototype.js with bunch of files
  remove common libraries from git repository

Publish wrench update
