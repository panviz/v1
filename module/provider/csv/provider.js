/**
 * Contacts Provider
 */
//TODO add i18n
Class.create('ProviderCsv', Provider, {
		
  driver: require('csv'),
  moment : require('moment'),

  outlook : function(contacts, data){
    var pairs = {
      "Имя": "firstName"
    , "Фамилия": "surname"
    , "День рождения": "bday"
    , "Категории": "group"
    //, "": ""
    }

    data.name = [data['Имя'], data['Отчество'], data['Фамилия']].compact().join(' ')
    $H(data).keys().each(function(key){
      var value = data[key];
      if (!value || value == "Не определен" || value == "0.0.00"){
        return delete data[key];
      }
      if (data[key]) data[key] = value.replace('\r', '');

      var newKey = pairs.hasOwnProperty(key) ? pairs[key] : null;
      if (newKey){
        data[newKey] = value;
        delete data[key];
      }
    })
    if (data.bday) data.bday = this.moment(data.bday, "d.M.yyy").toString();
    if (data.group) data.group = data.group.split(';')
    contacts.push(data);
  },

  /**
   * @param type String source of csv
   */
  get : function(cb, path, type){
    // The only one type supported currently
    type = 'outlook';
    var contacts = [];
    this.driver()
      .fromPath(path, {
        columns: true
      })
      .transform(this[type].bind(contacts))
      .on('end', function(data, index){
        cb(contacts);
      })
  }
})
