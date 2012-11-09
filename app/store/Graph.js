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
   * @param String type Item type (model name)
   * @param String key property name
   * @param String value value to search records by
   * @returns Json record
   */
  //TODO consider regexp as value
  find : function(onFind, type, key, value){
    logger.debug("FIND type: "+type+ " key: "+key+ " = "+value);
    var self = this
    var cb = function(record, err){
      if (err) return onFind(err)
      self._getLinks(self._output.bind(self, onFind, record), record)
    }
    this._find(cb, type, key, value)
  },
  /**
   * @returns Node db record
   */
  _find : function(onFind, type, key, value){
    if (key == 'id'){
      this._db.getIndexedNode('node_auto_index', key, value, function(err, record){
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
        "START x=node(*)"
      , "WHERE x.KEY! = 'VALUE'"
      , "AND x.type! = 'TYPE'"
      , "RETURN x"
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
   * @param String id of record to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, id, diff){
    logger.debug("SAVE type: "+type+ " id = "+id);
    console.log(diff);
    var self = this;
    var db = this._db;
    var onFind = function(record, err){
      if (err && err != "Not Found") return onSave(null, err)
      if (diff){
              // Update
        if (record){
          //TODO handle item created with existing name
          if (diff.relations) self._updateLinks(diff.relations, id)
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
          if (!diff.createdAt) diff.createdAt = (new Date).toJSON()
          //TODO save outgoing links
          var links = diff.relations
          delete diff.relations
          record = db.createNode(diff);
          if (links) self._updateLinks(links, diff.id)
          record.save(function (err){
            if (err) return onSave(null, err);
            self._output(onSave, record, links)
          });
        }
      }
              // Remove
      else if (diff != undefined){
        //force links deletion
        //TODO remove
        console.log('DELETE');
        //record.delete(function(err){onSave(err)}, true)
      }
    }
    this._find(onFind, type, 'id', id)
    return diff;
  },
  /**
   * @param String id
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
    var onLoad = function(rows, err){
      var links;
      if (rows && !rows.isEmpty()){
        links = rows.map(function(row){
          var link = {}
          var rel = row.relation
          if (rel.end.id == node.id){
            link.direction = 'in';
          } else{
            link.direction = 'out';
          }
          link.target = row.targetID
          link.id = rel.data.id;
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
    var query = [
      "START x=node(ID)"
    , "MATCH x -[relation]- y"
    , "RETURN relation, y.id as targetID"
    ]
    query = query.join('\n')
      .replace('ID', node.id)

    this._db.query(query, function(err, array){
      onLoad(array, err)
    })
  },

  _updateLinks : function(diff, start){
    var db = this._db;
    var addition = (diff && diff[0]) ? diff[0] : []
    var privation = (diff && diff[1]) ? diff[1] : []
    addition.each(function(link){
      var query = [
        "START a=node:node_auto_index(id = 'FROM'), b=node:node_auto_index(id = 'TO')"
      , "CREATE a-[r:TYPE {id : 'ID'}]->b"
      , "RETURN r"
      ].join('\n')
      .replace('FROM', start)
      .replace('TO', link.target)
      .replace('ID', link.id)
      .replace('TYPE', link.type)
      console.log(query);
      db.query(query, function(err, record){
        console.log(err);
        console.log(record[0]);
      })
    })
    privation.each(function(link){
      var query = [
        "START r=relationship:relationship_auto_index(id = ID)"
      ].join('\n')
      .replace('ID', link.id)
      console.log(query);
      db.query(query, function(err, record){
        console.log(err);
        console.log(record[0]);
      })
    })
  },

  _output : function(cb, record, links){
    var data = record.data;
    data.relations = links;
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
