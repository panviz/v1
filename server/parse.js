#!/usr/bin/env node

var fs = require('fs'),
  , util = require('util')
  , wrench = require('wrench')
    //works under linux
  //, parser = require('xml2json')
  , path = process.cwd();

var test = function(files){
  var counter = 0;
  files.forEach(function(file){
    if (file.match(/test/gi)) {
      var filename = path + '/module/' + file;
      var f = new wrench.LineReader(filename);
      console.log(counter + filename)
    //fs.writeFileSync(filename, data);
    }
  })
}

var php2Json = function(files){
  files.forEach(function(file){
    if (file.match(/i18n.*\.php$/gi)) {
      var filename = path + '/module/' + file;
      var data = '{\n';
      var f = new wrench.LineReader(filename);
      while(f.hasNextLine()) {
        var line = f.getNextLine();
          if (line.match(/=>/)){
            data += line.replace(/=>/, ':').replace(/\s*$/, '');
            data += '\n';
          }
      }
      data += '}'
      fs.writeFileSync(filename.replace(/\.php$/, '.json'), data);
      fs.unlink(filename);
    }
  })
}

var xml2json = function(files){
  files.forEach(function(file){
    if (file.match(/user.xml$/g)) {
      var filename = path + '/config/' + file;
      console.log(filename);
      var xml = fs.readFileSync(filename);
      var data = parser.toJson(xml)
      //add formatting
      var data = JSON.stringify(data, null, '');
      fs.writeFileSync(filename.replace(/\.xml$/,'.json'), data)
    }
  })
}

var replace = function(files){
  var exp = 'modal\.';
  var sub = '$modal\.';
  var counter = 0;
  var process = [];
  var regxp = new RegExp(exp);
  files.forEach(function(file){
    if (file.match(/\.js|\.txt|\.html|\.css|\.xml/gi)) {
      //don't match this parser and .gitignore
      if (file.indexOf('node_modules') >= 0 || file.indexOf('parse.js') >= 0) {
        return;
      }
      process.push(path + '/' + file);
    }
  })
  process.forEach(function(file){
    var data = '';
    var changed = false;
    var f = new wrench.LineReader(file);
    while(f.hasNextLine()) {
      var line = f.getNextLine();
      if (line.match(regxp)){
        var index = line.indexOf(exp);
        console.log('\x1b[36m'+exp+'\x1b[90m' + line.substr(index+exp.length, 110) + '\x1b[90m');
        line = line.replace(regxp, sub);
        changed = true;
        counter++
      }
      data += (line +'\n');
    }
    if (changed){
      console.log('\x1b[31m'+counter+'\x1b[32m' + ': '+ file)
      //fs.writeFileSync(file, data);
    }
  })
}

var files = wrench.readdirSyncRecursive('.');
replace(files)
