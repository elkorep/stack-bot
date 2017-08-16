var appliance = require('../applianceDB.json');
var ping = require('ping');

exports.checkifServerExist = function(serverName) {
  return new Promise(function(resolve, reject) {
    for (var i = 0; i < Object.keys(appliance).length; i++) {
      if (serverName === appliance[i].name) {
        var app = {
          name: appliance[i].name,
          hostname: appliance[i].hostname,
          username: appliance[i].username,
          password: appliance[i].password,
        };
        pingServer(app).then(function() {
          resolve(app);
        });
      }
    }
    return;
  });
};

exports.listStacks = function() {
  var stacks = {
    length: Object.keys(appliance).length,
    names: [],
    hostnames: [],
  };

  for (var i = 0; i < Object.keys(appliance).length; i++) {
    stacks.names[i] = appliance[i].name;
    stacks.hostnames[i] = appliance[i].hostname;
  }
  return stacks;
};

function pingServer(app) {
  return new Promise(function(resolve, reject) {
    server = app.hostname;

    ping.promise.probe(server, {
      timeout: 1,
      extra: ['-i 0.1'],
    }).then(function(res) {
      console.log(res.alive);
      app.alive = res.alive;
      console.log(JSON.stringify(app));
      resolve(app);
    });
  });
};
