/**
 * File System access
 */
Class.create('DriverVCard', {
  validFields: require('./fields'),

  // TODO replace with Object.flatten
  initialize : function(){
    this.allFields = this.validFields.singleText.concat(this.validFields.multipleText).concat(this.validFields.singleBinary).concat(this.validFields.rfc2425).concat(this.validFields.structured).compact()
  },
		
	/**
	 * Read file from disk, prepare and parse it.
	 */
	readFile : function(file){
    var self = this;
		if (fs.existsSync(file)){
      var data = fs.readFileSync(file, 'ascii')
      var json = [];
      var cards = this.prepare(data);

      cards.forEach(function(card){
        json.push(self.parse(card));
      })
      return json;
		} else {
			return file + " not found. Does it exist?";
		}
	},

  /**
   * 
   */
  prepare : function(data){
    var cards = [];
    var inCard = false;
    var card = [];
    data = data.replace(/\r/g, '').split('\n');

    for (var i = 0; i<data.length; i++) {
      // Skip empty line
      if (data[i] == "" ) continue;

      if (data[i] == this.validFields.begin){
        card = [];
        inCard = true;
        // Skip begin field
        continue;
      }
      if (data[i] == this.validFields.end){
        inCard = false;
        card = $A(card).compact();
        if (card.length < 1) continue;
        cards.push(card);
      }
      if (inCard){
        // Append text to previous field
        if (data[i].match(/^\s/)){
          card[card.length-1] = card[card.length-1]+data[i].replace(/^\s/, '');
        }
        var field = data[i].replace(/(:|;).*/g, '');
        if (!(this.allFields.include(field) ||
          field.match(/^X-.*/))){
          continue;
        }
        // Add field
        card.push(data[i]);
      }
    }
    return cards;
  },

	/**
   * @param data Array of card fields
	 */
	parse : function(data){
		var json = {};
		var version = this._getVersion(data);

		for (var f = data.length-1; f >= 0; f--){
			var fields = data[f].split(":");
      var key = fields[0]; var value = fields[1];

			/* Do the simple bits first, the singleText and extension fields. */
			if (this.validFields.singleText.include(key) ||
			    this.validFields.rfc2425.include(key) ||
			    key.match(/^X-.*/)) {
          if (key == "BDAY"){
            json[key] = new Date(Date.parse([value.substr(0,4), value.substr(4,2), value.substr(6,2)].join('/')));
          }  else{
            json[key] = value;
          }
				/* Shrink the data buffer with what has just been added. */
				data.splice(f, 1);
			}
		}

    //TODO parse ADR field
		/* Now go through it again, but take care of structured fields. */
		for (var f = data.length-1; f >= 0; f--) {
			//TODO Don't split on http://
			var fields = data[f].split(":");
      var key = fields[0]; var value = fields[1];
      
			/*
			 * Based on the version we're looking at a different way the structured fields
			 * are declared. For example
			 * 2.1: TEL;WORK;VOICE:(111) 555-1212
			 * 3.0: TEL;TYPE=WORK,VOICE:(111) 555-1212
			 * 4.0: TEL;TYPE="work,voice";VALUE=uri:tel:+1-111-555-1212
			 *
			 * These will all result in:
			 *  TEL: { type: [ 'VOICE', 'WORK' ], value: '(111) 555-1212' },
			 */

			var d = key.split(";");
			var snippet = {};
			var type = [];
      /* Be sure to remove any left over control chars, but give a special treat to N */
      var clear = function(){
        if (d[0] === 'N') {
          json[d[0]] = value.replace(/;+$/g, '').replace(/;/, ', ').replace(/ $/, '');
        } else {
          json[d[0]] = value.replace(/;/g, ' ');
        }
      }

			if (version == 3.0) {
				/* Strip off 'TYPE' argument before doing anything else. */
				if (d[1]) {
					d[1] = d[1].replace(/TYPE=/g, '');
				}
			}

			if (version === 2.1 || version == '3.0') {
				/* If we have a structured field, handle the extra
				   data before the ':' as types. */
				for (var i = d.length-1; i >= 1; i--){
					type.push(d[i]);
				}

				/*
				 * Some fields can be structured, but are still
				 * just single. So test for that.
				 */
				if (type.length > 0) {
					snippet.type = type;
					snippet.value = value;
					json[d[0]] = snippet;
				} else {
          clear();
				}
			} else if (version === 4) {
				var label = [];
				var value = [];

				/* Use the TYPE, LABEL and VALUE fields to pop extra data into the snippet. */
				for (var i = d.length-1; i >= 1; i--){
					if (d[i].match(/TYPE/)) {
						/* This can be a nested type..split it. */
						var t = d[i].replace(/TYPE=/g, '').replace(/\"/g, '').split(",");
						for (var j = t.length -1; j >= 0; j--) {
							type.push(t[j]);
						}
					} else if (d[i].match(/LABEL/)) {
						/* Certain labels are quoted, so unquote them now. */
						label.push(d[i].replace(/LABEL=/g, '').replace(/\"/g, ''));
					} else if (d[i].match(/VALUE/)) {
						value.push(d[i].replace(/VALUE=/g, ''));
					}
				}

				/*
				 * Some fields can be structured, but are still
				 * just single. So test for that.
				 */
				if (type.length > 0) {
					snippet.type = type;
					if (label.length > 0) {
						snippet.value = label[0];
					} else {
						snippet.value = fields[2];
					}
					json[d[0]] = snippet;
				} else {
          clear();
				}
			} else {
				throw "Unknown version encountered: "+ version;
			}
		}

    return json;
	},

  /**
   * @param json Object vCard in json
   * @param path String path to save extracted files
   * @param fields Array optional binary fields to extract
   */
  extractBinary : function(json, path, fields){
    path = path || ".";

    this.validFields.singleBinary.forEach(function(key){
      var field = json[key];
      if (field && field.value && field.type[1]){
        var dir = path + '/' + key.toLowerCase() + '/'
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        var buffer = new Buffer(field.value, 'base64');
        path = dir + json.N + '.' + field.type[1].toLowerCase();
        fs.writeFileSync(path, buffer);
        delete json[key];
      }
    })
  },

	/**
  * Determine the version for the vCard.
  */
	_getVersion : function(data){
		/* Figure out the version of the vCard format. */
		for (var f = data.length-1; f >= 0; f--){
			if (data[f].match(/VERSION/)) {
				version = data[f].split(":")[1];
			}
		}

		var version = parseFloat(version);
		if (isNaN(version)) {
			return 0;
		} else {
			return version;
		}
	}
})
