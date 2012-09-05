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

  //TODO create index by type 
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
    this._db.getNodeById(id, function (err, record){
      if (!err && !record) err = "Not Found";
      if (record) record = record.data;
      onFind(record, err);
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

    if (this._uniqColumns.include(key)){
      this._db.getIndexedNode(type, key, value, function (err, record){
        if (!err && !record) err = "Not Found";
        if (record) record = record.data;
        onFind(record, err);
      })
    } else {
      var query = [
        "START x=node(*)",
        "WHERE x.KEY! = 'VALUE'",
        "RETURN x"
      ].join('\n')
          .replace('KEY', key)
          .replace('VALUE', value)
      this._db.query(query, function(err, array){
        var record = array[0];
        if (!err && !record) err = "Not Found";
        if (record) record = record.x.data;
        onFind(record, err);
      })
    }
  },

  /**
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, name, diff){
    var db = this._db;
    if (diff){
      var onFind = function(err, node){
        if (err) return onSave(null, err);
        // Update
        if (node){
          node.data = Object.extend(node.data, diff)
          var cb = function(){onSave(diff)}
          node.save(cb);
        }
        // Create
        else {
          console.log('CREATE');
          //diff.name = name;
          //var node = db.createNode(data);
          //node.save(function (err) {
            //if (err) return onSave(null, err);
            //node.index(type, 'name', name, function (err) {
              //if (err) return onSave(null, err);
              //onSave(diff);
            //});
          //});
        }
      }
      this._db.getIndexedNode(type, 'name', name, onFind);
    }
    // Remove
    else{
      //TODO
    }
    return diff;
  }
})
