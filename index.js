#!/usr/bin/env node
var nconf = require('nconf');
var colors = require('colors');
var co = require('co');
var prompt = require('co-prompt');
var Twit = require('twit');
var vorpal = require('vorpal')();
var emoji = require('node-emoji');
var fs = require('fs');

console.log(emoji.emojify('Created with :heart:  in :flag-tr:!')); // replaces all :emoji: with the actual emoji, in this case: returns "I ❤️ ☕️!"

fs.writeFile('config.json', '{}', { flag: 'wx' }, function (err) {});

nconf.use('file', { file: 'config.json' });
nconf.load();

if(!nconf.get('username')) {

  co(function *() {
    console.log('Please write down your twitter api credentials: ');

    var consumer_key = yield prompt('Consumer key: ');
    var consumer_secret = yield prompt('Consumer secret: ');
    var access_token_key = yield prompt('Access token key: ');
    var access_token_secret = yield prompt('Access token secret: ');

    nconf.set('consumer_key', consumer_key);
    nconf.set('consumer_secret', consumer_secret);
    nconf.set('access_token_key', access_token_key);
    nconf.set('access_token_secret', access_token_secret);

    var T = new Twit({
      consumer_key:         consumer_key,
      consumer_secret:      consumer_secret,
      access_token:         access_token_key,
      access_token_secret:  access_token_secret,
      timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    });

    T.get('account/verify_credentials', { skip_status: true })
    .catch(function (err) {
      console.log('caught error', err.stack)
    })
    .then(function (result) {
      console.log('data', result.data);
      nconf.set('user', result.data);
      nconf.set('username', result.data.name);

      nconf.save(function (err) {
        if (err) {
          console.error(err.message);
          return;
        }
        console.log('Configuration saved successfully.');
        hello(nconf.get('username'));
      });
    })

  });
} else {
  hello(nconf.get('username'));
}

function hello(name) {
  console.log('Hello' + " " + name.rainbow);

  vorpal
    .command('search [strings...] [optionalArg]')
    .option('-l, --language', 'Language based search example: en, tr, fr')
    .description('Search parameters')
    .alias('search')
    .action(function(args, callback) {
      if (args.options.language) {
        this.log('language');
        console.log(args.options.language[0]);
      }
      console.log(args.strings);
      callback();
    });


  vorpal
    .delimiter(emoji.emojify(':computer:  >_'))
    .show();

}

// var Twitter = require('twitter');
// var Table = require('cli-table');
// var ProgressBar = require('progress');
//
// var barOpts = {
//    width: 20,
//    total: 100,
//    clear: true
//  };
//  var bar = new ProgressBar(' uploading [:bar] :percent :etas', barOpts);
//
//
// setInterval(function(){ bar.tick(1); }, 3000);
//

//
// var params = {screen_name: 'nodejs'};
// client.get('statuses/user_timeline', params, function(error, tweets, response){
//   if (!error) {
//     console.log(tweets);
//   }
// });
//
// var table = new Table({
//   chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
//          , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
//          , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
//          , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
// });
//
// table.push(
//     ['foo'.rainbow, 'bar'.rainbow, 'baz'.rainbow, 'baz'.rainbow, 'baz'.rainbow]
//   , ['frob'.rainbow, 'bar'.rainbow, 'quuz'.rainbow, 'baz'.rainbow, 'baz'.rainbow]
// );
//
// console.log(table.toString());
// console.log('ç²'.random);

//
