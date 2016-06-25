#!/usr/bin/env node
var nconf = require('nconf');
var colors = require('colors');
var co = require('co');
var prompt = require('co-prompt');
var Twit = require('twit');
var vorpal = require('vorpal')();
var emoji = require('node-emoji');
var Table = require('cli-table');

/*
  Load config file
*/
nconf.use('file', { file: './config.json' });
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
      nconf.set('user', result.data);
      nconf.set('username', result.data.name);
      /* Save config */
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

  var T = new Twit({
    consumer_key:         nconf.get('consumer_key'),
    consumer_secret:      nconf.get('consumer_secret'),
    access_token:         nconf.get('access_token_key'),
    access_token_secret:  nconf.get('access_token_secret'),
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });

  // TODO : seperate commands.

vorpal
  .command('stream [strings...]')  // strings = [ '1', '2', '3'];
  .option('-s, --save', 'Save tweets in config file')
  .description('Stream for selected parameters')
  .action(function(args, callback) {
    var stream = T.stream('statuses/filter', { track: args.strings })
    var table = new Table({
      chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
             , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
             , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
             , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
    });
    stream.on('tweet', function (tweet) {
      if (args.options.save) {
        nconf.set('tweets:', tweet); // TODO : fix override.
      }
      table.push(
          [tweet.user.name, tweet.text.slice(0,40), tweet.retweet_count, tweet.favorite_count]
      );
      console.log(table.toString());
    });
  })
  .cancel(function () {  // TODO : fix override.
      nconf.save(function (err) {
        if (err) {
          console.error(err.message);
          return;
        }
      });
    });

vorpal
  .mode('tweet')
  .delimiter('?>  ')
  .init(function(args, callback){
    console.log(' \t Write your tweet\n \t Feel free dude.. \n \t To exit, type `exit`.');
    callback();
  })
  .action(function(command, callback) {
    T.post('statuses/update', { status: command }, function(err, data, response) {
      console.log('Your tweet has gone!');
      callback();
      })
    });


vorpal
  .mode('follow')
  .delimiter('?>  ')
  .init(function(args, callback){
    console.log(' \t Write the screen_name you want to follow. \n \t To exit, type `exit`.');
    callback();
  })
  .action(function(command, callback) {
    T.post('friendships/create', {screen_name:command}, function(err, data, response) {
      if (err) {
        console.error(err.message.underline.red);
      } else {
        console.log(emoji.emojify('Fly like a butterfly sting like a :bee:')); // postbox
      }
      callback();
      })
    });

vorpal.command('dm', 'Send direct message')
  .action(function (args, callback) {
    var self = this;

    var promise = this.prompt([
      {
        type: 'input',
        name: 'screenName',
        message: emoji.emojify(':dart: Target:') // dart
      },
      {
        type: 'input',
        name: 'text',
        message: emoji.emojify(':speech_balloon: Content:') // speech_balloon
      }
    ], function (answers) {
      // You can use callbacks...
    });

    promise.then(function(command) {
      // Or promises!
      T.post('direct_messages/new', {screen_name:command.screenName, text: command.text}, function(err, data, response) {
        if (err) {
          console.error(err.message.underline.red);
        } else {
          console.log(emoji.emojify('Piyuuv :postbox:')); // postbox
        }
        callback();
        })

    });
  });

  // TODO POST VIDEO :

  // T.postMediaChunked({ file_path: fileAbsoluteName }, function (err, data, response) {
  //         if (!err || data === 'undefined') {
  //           console.log(data)
  //           // Lets tweet it
  //           var status = {
  //             status: params.status,
  //             media_ids: data.media_id_string // Pass the media id string
  //           }
  //
  //           client.post('statuses/update', status, function(error, tweet, response) {
  //             if (!error) {
  //               console.log(tweet);
  //             } else {
  //               console.log(error);
  //               fs.unlink(fileAbsoluteName, () => { // Delete item.
  //                 console.log(`${fileAbsoluteName} deleted successfully.`);
  //               });
  //             }
  //           });
  //         } else {
  //           console.log(err);
  //           fs.unlink(fileAbsoluteName, () => { // Delete item.
  //             console.log(`${fileAbsoluteName} deleted successfully.`);
  //           });
  //         }
  //       });

  // TODO POST VIDEO :


  // TODO POST IMG
// var b64content = fs.readFileSync('/path/to/img', { encoding: 'base64' })
//
// // first we must post the media to Twitter
// T.post('media/upload', { media_data: b64content }, function (err, data, response) {
//   // now we can assign alt text to the media, for use by screen readers and
//   // other text-based presentations and interpreters
//   var mediaIdStr = data.media_id_string
//   var altText = "Small flowers in a planter on a sunny balcony, blossoming."
//   var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
//
//   T.post('media/metadata/create', meta_params, function (err, data, response) {
//     if (!err) {
//       // now we can reference the media and post a tweet (media will attach to the tweet)
//       var params = { status: 'loving life #nofilter', media_ids: [mediaIdStr] }
//
//       T.post('statuses/update', params, function (err, data, response) {
//         console.log(data)
//       })
//     }
//   })
// })

// TODO POST IMG


    // TODO : search
    // TODO : user followers ( who is follow me/other guy? )
    //
    /*
    T.get('followers/ids', { screen_name: 'c2' },  function (err, data, response) {
      console.log(data)
    })
    */
    // TODO : handle events. ( Anybody message me? Follow me? Like my tweet ? Mentioned ? ) *
    // TODO : read inbox *
    // TODO : spawn process may be impossible ?
    // TODO : bot mode. -f -dm -l ( Follow, direct message, fav tweet)

vorpal
  .delimiter(emoji.emojify(':computer:  >_'))
  .show();

}
