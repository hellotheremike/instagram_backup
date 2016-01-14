require('dotenv').load();
var ig = require('instagram-node').instagram();
var _ = require('lodash');
var fs = require('fs');
var http = require('http');

var request = require('request');
var user_id = process.env.INSTAGRAM_USER_ID
var count = 0;
var last_max_id = 0;
var videos = []

ig.use({ client_id: process.env.CLIENT_ID,
         client_secret: process.env.CLIENT_SECRET });

ig.user_media_recent(user_id, {count: 30}, function(err, medias, pagination, remaining, limit) {
  _.forEach(medias, function(post){
    savePost(post)
  })

  count += medias.length
  itterate(requestOptions(pagination))
});



function itterate(options) {
  ig.user_media_recent(user_id, options, function(err, medias, pagination, remaining, limit) {
    if (last_max_id != pagination.next_max_id ) {
      _.forEach(medias, function(post){
        savePost(post)
      })
      count += medias.length
      console.log(count)
      itterate(requestOptions(pagination))
    }

    console.log(count)
    console.log("done")

  });
}

function requestOptions(pagination) {
  last_max_id = pagination.next_max_id
  return {count: 30, max_id: pagination.next_max_id}
}

function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function(response) {
      if (response.statusCode !== 200) {
        return cb('Response status was ' + response.statusCode);
      }
    });

    // check for request errors
    sendReq.on('error', function (err) {
      fs.unlink(dest);

      if (cb) {
        return cb(err.message);
      }
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        file.close(cb);  // close() is async, call cb after close completes.
      });

    file.on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)

        if (cb) {
          return cb(err.message);
        }
      });
  };

function savePost(post){
  var path = "posts/" + post.created_time;
  var name = "posts/" + post.created_time + "/" +post.created_time;

  fs.mkdir(path ,function(e){
    if(!e || (e && e.code === 'EEXIST')){
      if (post.caption) {
        var caption = post.caption.text;
        fs.writeFile(name+".txt", caption, function(err) {
          if(err) {
            return console.log(err);
          }

          console.log(name + " text created");
        });
      }

      var filename = name + ".jpg"

      download(post.images.standard_resolution.url, filename , function(){
        console.log(name + " image downloaded");
      });

      if (post.videos) {
        var filename = name + "_video.mp4"
        download(post.videos.standard_resolution.url, filename , function(){
          console.log(" video downloaded");
        });
      }
    }
  });


}
