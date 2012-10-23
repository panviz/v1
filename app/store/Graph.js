var neo4j = require('neo4j');

Class.create("StoreGraph", {
  /**
   * @param Array uniq column names to be uniq
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
   * @param String type model name
   * @param Number id
   */
  findById : function(onFind, id){
    var self = this;
    this._db.getNodeById(id, function (err, record){
      if (err) return onFind(null, err)
      if (!record) return onFind(null, "Not Found");
      self._getLinks(self.output.bind(self, onFind, record), record)
    });
  },
  /**
   * @param String type Item type (model name)
   * @param String key property name
   * @param String value value to search records by
   * @returns Json record
   */
  find : function(onFind, type, key, value){
    logger.debug("FIND type: "+type+ " key: "+key+ " value: "+value);
    var self = this
    var cb = function(record, err){
      if (err) return onFind(err)
      self._getLinks(self.output.bind(self, onFind, record), record)
    }
    this._find(cb, type, key, value)
  },
  /**
   * @returns Node db record
   */
  _find : function(onFind, type, key, value){
    if (key == 'id'){
      this._db.getNodeById(value, function (err, record){
        return onFind(record, err)
      });
      return
    }
    //TODO indexing
    if (false){//this._uniqColumns.include(key)){
      this._db.getIndexedNode(type, key, value, function (err, record){
        if (!err && !record) err = "Not Found";
      })
    } else {
      var query = [
        "START x=node(*)",
        "WHERE x.KEY! = 'VALUE'",
        "AND x.type! = 'TYPE'",
        "RETURN x"
      ]
      // Default type is not stored
      if (!type) query = query.without(query[2]);
      query = query.join('\n')
        .replace('TYPE', type)
        .replace('KEY', key)
        .replace('VALUE', value)

      this._db.query(query, function(err, array){
        if (err) return onFind(null, err)
        var row = array[0];
        if (!row) return onFind(null, "Not Found");
        //TODO consider multiple results
        onFind(row.x)
      })
    }
  },
  /**
   * Create, Update & Delete
   * @param Object diff with data to save into the record
   * @param {Number|String} idOrName of record to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, idOrName, diff){
    logger.debug("SAVE type: "+type+ " idOrName: "+idOrName);
    console.log(diff);
    var self = this;
    var db = this._db;
    var onFind = function(record, err){
      if (err && err != "Not Found") return onSave(null, err)
      if (diff){
              // Update
        if (record){
          //TODO handle item created with existing name
          //TODO update outgoing links
          delete diff.relations
          Object.extend(record.data, diff)
          var cb = function(err){
            onSave(diff, err)
          }
          self._beforeSave(record.data);
          record.save(cb);
        }
              // Create
        else {
          type = type || 'item'
          diff.createdAt = (new Date).toJSON()
          //TODO save outgoing links
          var links = diff.relations
          delete diff.relations
          record = db.createNode(diff);
          record.save(function (err){
            if (err) return onSave(null, err);
            record.index(type, 'name', diff.name, function(err){
              if (err) return onSave(null, err);
              self.output(onSave, record, links)
            });
          });
        }
      }
              // Remove
      else{
        //force links deletion
        //TODO remove
        console.log('DELETE');
        //record.delete(function(err){onSave(err)}, true)
      }
    }
    var key = Object.isNumber(idOrName) ? 'id' : 'name'
    this._find(onFind, type, key, idOrName)
    return diff;
  },
  /**
   * @param Item id
   * @param String p.type of link
   * @param Boolean p.direction (true for out)
   * @returns Array of linked Items
   */
  getLinked : function(onFind, id, p){
    p.type = p.type || 'REL';
    cb = function(err, node){
      if (err || !node) return onFind(null);
      var cb = function(err, array){
        if (err || !array[0]) return onFind(null);
        var out = array.map(function(row){
          return row.data;
        })
        onFind(out);
      }
      node.getRelationshipNodes(p, cb)
    }
    db.getNodeById(id, cb)
  },

  // Load & transform relationship objects to links data format
  _getLinks : function(cb, node){
    var onLoad = function(err, rels){
      var links;
      if (rels){
        links = rels.map(function(rel){
          var link = {};
          if (rel.end.id == node.id){
            link.direction = 'in';
            link.to = rel.start.id;
          } else{
            link.direction = 'out';
            link.to = rel.end.id;
          }
          link.id = rel.id;
          link.type = rel.type;
          return link;
        })
      } else {
        links = [];
      }
      // if links are not empty array - try reload on error
      if (err) links = false;
      cb(links);
    }
    node.all('REL', onLoad)
  },

  output : function(cb, record, links){
    var data = record.data;
    data.id = record.id;
    data.relations = links;
    console.log(data);
    this._parse(data);
    cb(data);
  },
  /**
   * Neo4j doesn't support Maps as node's property
   */
  _parse : function(data){
    $H(data).keys().each(function(key){
      try{data[key] = JSON.parse(data[key])}
      catch (e){return}
    })
    return data;
  },
  /**
   * Neo4j doesn't support Maps as node's property
   */
  _beforeSave : function(data){
    $H(data).keys().each(function(key){
      var value = data[key]
      if (!Object.isNumber(value) && !Object.isString(value)){
        if (Object.isArray(value)){
          for (var i=0;i<value.length;i++){
            if (!Object.isString(value[i])) value[i] = JSON.stringify(value[i])
          }
        } else{
          data[key] = JSON.stringify(value)
        }
      }
    })
    return data;
  }
})
