var appliance = require('./applianceDB.json');
var config = require('./slack-config.json');
var RtmClient = require('@slack/client').RtmClient;
var SSH = require('simple-ssh');

var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var botToken = config.botToken;
var channel = config.slackchannel;
var rtm = new RtmClient(botToken);

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
  console.log('Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}');
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  var res = message.text.split(' ');

  var status = (res[0] === 'show' && res[1] === 'status' && res[2] === 'of');
  var version = (res[0] === 'show' && res[1] === 'version' && res[2] === 'of');
  var update = (res[0] === 'update' && res[2] === 'stack' &&
   res[3] === 'to' && res[4] === 'latest');

  if (status || version) {
    var nodeCommand = res[0] + ' ' + res[1];
    var mangementNode = res[3];
    app = checkifServerExist(mangementNode);

    if (app) {
      checkApplianceSystem(app, nodeCommand);
    } else {
      applianceDoesntExist();
    }
  }

  if (update) {
    var mangementNode = res[1];
    var buildVersion = res[5];
    app = checkifServerExist(mangementNode);
    if (app) {
      upgradeApplianceToLatest(app, buildVersion);
    } else {
      applianceDoesntExist();
    }
  }
});

function checkifServerExist(serverName) {
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
}

function checkApplianceSystem(server, command) {
  var reply = server.hostname + '\n ----------------\n';
  var errorReply = server.name + ' stack is unresponsive...please troubleshoot';

  var ssh = new SSH({
    host: server.hostname,
    user: server.username,
    pass: server.password,
  });
  ssh.exec('system ' + command, {
    out: function(stdout) {
      if (stdout) { rtm.sendMessage(reply.concat(stdout), channel); };
    },
    err: function(stderr) {
      if (stderr) { rtm.sendMessage(stderr, channel); };
    },
    exit: function(code) {
      console.log(code);
      if (code == 1) { rtm.sendMessage(errorReply, channel); };
    },
  }).start();
}

function upgradeApplianceToLatest(server, buildVersion) {
  reply = 'Upgrading ' + server.hostname + ' to latest ' + buildVersion + ' ' + buildURL;
  rtm.sendMessage(reply, channel);
}

function applianceDoesntExist() {
  rtm.sendMessage('Appliance does not exist', channel);
  console.log('server doesnt exist');
}

rtm.start();
