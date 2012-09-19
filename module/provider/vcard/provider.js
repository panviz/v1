require('driver');

Class.create('ProviderVCard', Provider, {
		
	initialize : function(){
    this.driver = new DriverVCard();
	},

  read : function(file){
    return this.driver.readFile(file);
  },

  skype : function(json){
    json.forEach(function(card){
      var pairs = {
        "N": "skype"
      , "FN": ""
      , "REV": ""
      , "X-SKYPE-NUMBER-OF-BUDDIES": "buddies"
      , "X-SKYPE-CITY": "city"
      , "X-SKYPE-COUNTRY": "country"
      , "X-SKYPE-LANGUAGE": "language"
      , "ADR": "address"
      , "X-SKYPE-AUTHCERTIFICATE;ENCODING=B": ""
      , "X-SKYPE-SEX": "sex"
      , "X-SKYPE-MOOD": "mood"
      , "X-SKYPE-DISPLAYNAME": ""
      , "X-SKYPE-USERNAME": ""
      }

      card.name = card["X-SKYPE-DISPLAYNAME"] || card["FN"] || card["N"];
      if (card["PHOTO"]) card.photo = true;
      vcf.extractBinary(card, '.');

      $H(card).keys().each(function(key){
        var newKey = pairs.hasOwnProperty(key) ? pairs[key] : key.toLowerCase();
        if (newKey) card[newKey] = card[key];
        if (newKey !== key) delete card[key];
      })
    })
    return json;
  }
})
