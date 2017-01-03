// Sync the directories for non-content dirs ONLY
// that way, we can clean up stuff left behind without pain
var util = require('util');
var AWS = require('aws-sdk');
var async = require('async');
var spawn = require('child_process').spawn;
var fs = require('fs');
var request = require('request');
var extract = require('extract-zip')
var s3 = require('s3');

var dstBucket = 'bpho-src';

tmpDir = '/tmp';

var syncClient = s3.createClient({
    maxAsyncS3: 20,
});

function handleDeploy(message, dstBucket, context) {
  var repo = message.repository;
  var zipLocation = `${tmpDir}/master.zip`;
  var unzippedLocation = `${tmpDir}/${repo.name}-master`;

  async.waterfall([
    function getZippedRepo(next) {
      console.log('Fetching repo %s', repo.name);
      var zipUrl = `${repo.html_url}/archive/master.zip`;
      request(zipUrl)
        .pipe(fs.createWriteStream(zipLocation))
        .on('error', function(err) {
            console.error('Request failed with error: ' + err);
            next(err);
        })
        .on('close', function () {
          console.log('Finished downloading %s', zipUrl);
          next(null);
        });
    },
    function unzipRepo(next) {
      console.log('Unzipping %s to %s', zipLocation, unzippedLocation);
      extract(zipLocation, { dir: tmpDir }, function (err) {
        if (err) {
          console.error('Unzip failed with error: ' + err);
          next(err);
        }
        console.log('Finished unzipping');
        next(null);
      });

    },
    function upload(next) {
      console.log('Syncing %s to bucket %s', unzippedLocation, dstBucket);
      var params = {
        localDir: unzippedLocation,
        deleteRemoved: true,
        s3Params: {
          Bucket: dstBucket,
        },
      };
      var uploader = syncClient.uploadDir(params);
      uploader.on('error', function(err) {
        console.error('Sync failed with error: ', err.stack);
        next(err);
      });
      uploader.on('end', function() {
        console.log('Finished syncing to S3');
        next(null);
      });
    }
  ], function(error) {
      if (error) {
        console.error('Deploy failed due to: ' + error);
      } else {
        console.log('All methods in waterfall succeeded.');
      }

      context.done();
  });
}

exports.handler = function(event, context) {
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log('Reading options from event:\n', util.inspect(message, {depth: 5}));

  handleDeploy(message, dstBucket, context);
};
