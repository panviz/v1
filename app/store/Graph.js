var neo4j = require('neo4j');

Class.create("StoreGraph", {
  /**
   * @param uniq Array column names to be uniq
   */
  initialize : function(p){
    var url = p.url || 'http://localhost:7474';
    this._uniqColumns = [];
    this._db = new neo4j.GraphDatabase(url);
  },

  setUniq : function(uniq){
    var names = this._uniqColumns;
    if (Object.isArray(uniq)){
      this._uniqColumns = $A(names.concat(uniq)).compact();
    } else{
      this._uniqColumns.push(uniq);
    }
  },

  /**
   * @param type String model name
   * @param id Number
   */
  findById : function(onFind, id){
    this._db.getNodeById(id, function (err, node){
      if (err) throw("Not Found");
      onFind(node);
    });
  },

  /**
   * TODO retrieves Item with all its relationships
   * @param type String model name
   * @param key String property name
   * @param value String value to search records by
   * @returns Json record
   */
  find : function(onFind, type, key, value){
    if (!type || type == "id") return this.findById(onFind, value);
    //var findFunc = this._uniqColumns.include(key) ? this._db.getIndexedNode : this._db.getIndexedNodes;// change to find by not indexed property

    this._db.getIndexedNode(type, key, value, function (err, record){
      if (!err && !record && isServer) err = "Not Found";//NotFound(key);
      if (record) record = record.data;
      onFind(err, record);
    })
  },

  /**
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, name, diff){
    var db = this._db;
    var previous;
    if (diff){
      for (var i=0; i < s.length; i++){
        if (s[i].name == name){
         previous = $H(s[i]).clone(); break;
        }
      }
      // Update
      if (previous){
        s[i] = Object.extend(s[i], diff)
        var current = $H(s[i]);
        var diff = previous.diff(current);
      }
      // Create
      else {
        diff.name = name;
        s.push(diff);
      }
    }
    // Remove
    else{
      for (var i=0; i < s.length; i++){
        if (s[i].name == name){
         delete s[i];
        }
      }
    }
    onSave(diff);
    return diff;
  }
})
