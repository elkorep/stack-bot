var appliance = require('../applianceDB.json');

exports.checkifServerExist = function(serverName) {
  for (var i = 0; i < Object.keys(appliance).length; i++) {
    if (serverName === appliance[i].name) {
      var app = {
        name: appliance[i].name,
        hostname: appliance[i].hostname,
        username: appliance[i].username,
        password: appliance[i].password,
      };
      return app;
    }
  }
  return;
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
