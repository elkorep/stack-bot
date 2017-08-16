var appliance = require('../applianceDB.json');
var ping = require('ping');

exports.checkifServerExist = function(serverName) {
  return new Promise(function(resolve, reject) {
    if (appliance[serverName]) {
      var app = {
        name: appliance[serverName].name,
        hostname: appliance[serverName].hostname,
        username: appliance[serverName].username,
        password: appliance[serverName].password,
      };
      pingServer(app).then(function() {
        resolve(app);
      });
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

  for (var stack in appliance) {
    stacks.names[i] = stack;
    stacks.hostnames[i] = appliance[stack].hostname;
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
