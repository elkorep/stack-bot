var config = require('./../slack-config.json');
var SSH2Shell = require ('ssh2shell');
var intranetId = config.intranetId;
var intranetPw = config.intranetPw;
var request = require('request');
var url = config.buildsURL;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var S = require('string');

exports.upgradeAppliance = function(app, buildVersion) {
  build = buildVersion.substring(0, 3) + 'x' + buildVersion.substring(4);
  var buildUrl = url + build + '/onprem/';

  var options = {
    method: 'GET',
    url: buildUrl,
    headers: {
      authorization: 'Basic ' +
        new Buffer(intranetId + ':' + intranetPw).toString('base64'),
    },
  };

  request(options, function(error, response, body) {
    var regex = new RegExp('<a(.*?)>APIConnect_Management_5.0(.*?)<\/a>');
    buildregex = body.match(regex)[1];
    buildsplitregex  = S(buildregex).between('href="', '.ova').s;
    buildVcrypt2 = buildsplitregex + '.vcrypt2';
    update(buildUrl, buildVcrypt2);
  });
};

function update(buildUrl, buildVcrypt2) {
  firmwareURL = buildUrl + buildVcrypt2;
  var cmd1 = 'system update firmware from url ' + firmwareURL + ' user ' + intranetId;

  var host = {
    server: {
      host: app.hostname,
      userName: app.username,
      password: app.password,
    },
    standardPrompt: '>',
    enter: '\n',
    commands: [cmd1],
    onData: function(data) {
      // console.log(data);
    },
    onPipe: function(source) {
    //source is the read stream the write stream will receive output from
    },
    onCommandTimeout: function(command, response, stream, connection) {
      if (command === cmd1) {
        console.log(response);
        stream.write('no\n');
      }
    },
  };

  SSH = new SSH2Shell(host),
  callback = function(sessionText) {
    console.log(sessionText);
  };

  SSH.connect(callback);
}
