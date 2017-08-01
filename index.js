var appliance = require('./applianceDB.json');
var config = require('./slack-config.json');
var childProcess = require('child_process');
var RtmClient = require('@slack/client').RtmClient;

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
  var upgrade = (res[0] === 'upgrade' && res[1] === 'stack' &&
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

  if (upgrade) {
    var mangementNode = res[2];
    app = checkifServerExist(mangementNode);
    if (app) {
      upgradeApplianceToLatest(app);
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
  var cmd = 'sshpass -p ' + server.password + ' ssh ' +
  server.username + '@' + server.hostname + ' system ' + command;
  var reply = server.hostname + '\n ----------------\n';
  var stat = childProcess.exec(cmd, function(err, stdout, stderr) {
    if (stdout) { rtm.sendMessage(reply.concat(stdout), channel); };
    if (stderr) { rtm.sendMessage(stderr, channel); };
  });

  stat.on('exit', function(code) {
    console.log('child process spawn exited with exit code ' + code);
    var reply = server.name + ' stack is unresponsive...please troubleshoot';
    if (code == 255) { rtm.sendMessage(reply, channel); };
  });
}

function upgradeApplianceToLatest(server) {
  reply = 'Upgrading ' + server.hostname + ' to latest...';
  rtm.sendMessage(reply, channel);
}

function applianceDoesntExist() {
  rtm.sendMessage('Appliance does not exist', channel);
  console.log('server doesnt exist');
}

rtm.start();
