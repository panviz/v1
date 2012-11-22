Graph View
  Manage multiple contexts
  Search
    show graph of new node types sorted by popularity on 'plus' button click
    find by Enter key
    hide search node if 1 result on Enter
    remove hidden items revealed by previous search
  Actions
    Item
      Rename
      Delete
      Hide
      Merge
      ContextMenu
        Create Child
        Create Parent
    Link
      Create
      Delete
      Hide
    Base
      ContextMenu
        Create Item
          Item types

Editor View

Preview View
  Show thumbnail for image

Provider.Fs
  Import FS to Neo4j


  ------------- Minor
Server
  Js files buncher & minifier
    Remove code in 'isServer' blocks
    Remove methods with @server comment

EventManagement
  Implement ObjectWithEvent (destroy registered observers on View close)
  OR extend prototype to add events on Object

Other
  replace store.setUniq with index
  Make tests for Core classes
  
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
  
Prototype
  fully replace prototype.js with bunch of files
  remove common libraries from git repository
