var checkappliance = require('./source/checkappliance.js');
var childProcess = require('child_process');
var config = require('./slack-config.json');
var fs = require('fs');
var simpleSSH = require('simple-ssh');
var updateappliance = require('./source/updateappliance.js');

var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_CLIENT = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var botToken = config.botToken;
var channel = config.slackchannel;
var botName = config.botName;
var rtm = new RTM_CLIENT(botToken);

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
  console.log('Logged in as ' + rtmStartData.self.name + ' of team ' + rtmStartData.team.name);
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  var res = message.text.toLowerCase().split(' ');
  if(res[0] === 'stackbot' || res[0] === botName) {
      var help = (res[1] === 'help');
      var list = (res[1] === 'list' && res[2] === 'stacks');
      var reset = (res[1] === 'reset' && res[2] === 'stack');
      var status = (res[1] === 'show' && res[2] === 'status' && res[3] === 'of');
      var update = (res[1] === 'update' && res[3] === 'stack' &&
      res[4] === 'to' && res[5] === 'latest');
      var version = (res[1] === 'show' && res[2] === 'version' && res[3] === 'of');

      if (status || version) {
          var nodeCommand = res[2];
          var mangementNode = res[4];
          checkappliance.checkifServerExist(mangementNode).then(function (app) {
              if (app.alive) {
                  checkApplianceSystem(app, nodeCommand);
              } else {
                  applianceDoesntExist();
              }
          });
      }

      if (update) {
          var mangementNode = res[2];
          var buildVersion = res[6];
          checkappliance.checkifServerExist(mangementNode).then(function (app) {
              if (app) {
                  updateappliance.upgradeAppliance(app, buildVersion);
              } else {
                  applianceDoesntExist();
              }
          });
      }

      if (reset) {
          var mangementNode = res[3];
          app = checkappliance.checkifServerExist(mangementNode);
          if (app) {
              resetStack(app);
          } else {
              applianceDoesntExist();
          }
      }

      if (list) {
          listStacks();
      }

      if (help) {
          displayHelp();
      }
  }
});

function displayHelp() {
  var help = fs.readFileSync('./source/help.txt').toString();
  rtm.sendMessage(help, channel);
}

function resetStack(server) {
  var ssh = new simpleSSH({
    host: server.hostname,
    user: server.username,
    pass: server.password,
  });

  ssh.exec('system', {
    args: ['clean', 'apiconfig'],
    out: console.log.bind(console),
    in: ('yes\n'),
  }).start();
}

function listStacks() {
  var stacks = checkappliance.listStacks();
  for (var i = 0; i < stacks.length; i++) {
    rtm.sendMessage(stacks.names[i] + ' = ' + stacks.hostnames[i], channel);
  }
}

function checkApplianceSystem(server, command) {
  var reply = server.hostname + '\n ----------------\n';
  var errorReply = server.hostname + ' : UNABLE TO CONNECT...SEE ERROR BELOW';

  var cmd = 'sshpass -p ' + server.password + ' ssh ' +
   server.username + '@' + server.hostname + ' system show ' + command;
  var stat = childProcess.exec(cmd, function(err, stdout, stderr) {
    if (stdout) { rtm.sendMessage(reply.concat(stdout), channel); };
    if (stderr) { rtm.sendMessage(stderr, channel); };
  });

  stat.on('exit', function(code) {
    console.log('child process spawn exited with exit code ' + code);
    if (code == 255) { rtm.sendMessage(errorReply, channel); };
  });
}

function applianceDoesntExist() {
  rtm.sendMessage('Appliance does not exist', channel);
  console.log('server doesnt exist');
}

function applianceDoesntExist() {
  rtm.sendMessage('Appliance is down...please troubleshoot', channel);
  console.log('cannot reach server');
}

rtm.start();
