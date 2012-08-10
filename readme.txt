      TODO
Make tests for Core classes
  
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
