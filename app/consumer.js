// Copyright 2019-2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This is a generated sample, using the typeless sample bot. Please
// look for the source TypeScript sample (.ts) for modifications.
'use strict';

/**
 * This application demonstrates how to perform basic operations on
 * subscriptions with the Google Cloud Pub/Sub API.
 *
 * For more information, see the README.md under /pubsub and the documentation
 * at https://cloud.google.com/pubsub/docs.
 */

// sample-metadata:
//   title: Listen For Messages
//   description: Listens for messages from a subscription.
//   usage: node listenForMessages.js <subscription-name-or-id> [timeout-in-seconds]

// [START pubsub_subscriber_async_pull]
// [START pubsub_quickstart_subscriber]
/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// const subscriptionNameOrId = 'YOUR_SUBSCRIPTION_NAME_OR_ID';
// const timeout = 60;

const photoModel = require('./photo_model');
require('dotenv').config()
var moment = require('moment');

const ZipStream = require('zip-stream');
const request = require('request');
// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } = require("firebase/auth");

// const provider = new GoogleAuthProvider();
async function test (tags) {
    let storage = new Storage();
    const file = await storage
                    .bucket("dmii2023bucket")
                    .file('public/users/' + tags);
    const stream = file.createWriteStream({
        metadata: {
        contentType: 'application/zip',
        cacheControl: 'private'
        },
        resumable: false
    });
    return stream
  }

// Creates a client; cache this for further use
const pubSubClient = new PubSub({projectId: 'temporaryprojectdmii', // Your Google Cloud Platform project ID
topicNameOrId: 'dmii2-3', // Name for the new topic to create
subscriptionName: 'dmii2-3', // Name for the new subscription to create});
})

const firebaseConfig = {
    apiKey: "AIzaSyA7bgu7if0_0IzIWkbBr0lKFiClyu09mfA",
    authDomain: "temporaryprojectdmii.firebaseapp.com",
    projectId: "temporaryprojectdmii",
    storageBucket: "temporaryprojectdmii.appspot.com",
    messagingSenderId: "414973090394",
    appId: "1:414973090394:web:288cbd655aa9521e291663",
    databaseURL: 'https://temporaryprojectdmii-default-rtdb.firebaseio.com/',
    credential: applicationDefault(),
    };

  initializeApp(
    firebaseConfig
)

const db = getDatabase();
const ref = db.ref("Jonathan/saving-data/poulet");

function listenForMessages(subscriptionNameOrId, timeout) {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  // Create an event handler to handle messages
  let messageCount = 0;
  const messageHandler = message => {
    messageCount += 1;

    const data = JSON.parse(message.data)
    const ejsLocalVariables = {
        tagsParameter: data || '',
        tagmodeParameter: '' || '',
        photos: [],
        searchResults: false,
        invalidParameters: false
    };

    photoModel
      .getFlickrPhotos(data, 'ALL')
      .then(async photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;

        var queue = []
        const stream = await test(data)

        // loop through photos first 10
        for (var i = 0; i < 10; i++) {
          var elem = ejsLocalVariables.photos[i]
          queue.push({name: elem.title, link: elem.link})
        }

        var zip = new ZipStream()
        zip.pipe(stream);
        function addNextFile() {
          var elem = queue.shift()
          var stream = request(elem.link)
          zip.entry(stream, { name: elem.name }, err => {
              if(err)
                  throw err;
              if(queue.length > 0)
                  addNextFile()
              else
                  zip.finalize()
          })
         }
         addNextFile()
         return new Promise ((resolve, reject) => {
          stream.on('error', (err) => {
            return res.status(500).send({ error });
          });
          stream.on('finish', async () => {
            const options = {
                action: 'read',
                expires: moment().add(2, 'days').unix() * 1000
                };
            let storage = new Storage();
            const signedUrls = await storage
                .bucket(process.env.STORAGE_BUCKET)
                .file("public/users/" + data)
                .getSignedUrl(options);
            const zipRef = ref.child('zip');
            console.log(data)
            zipRef.set({
              tags: data,
              path: 'public/users/' + data,
              file: signedUrls
            });
              // "Ack" (acknowledge receipt of) the message
             message.ack();
            console.log("finish")
          });
        });
        // get photos from flickr public feed api
      })
      .catch(error => {
          console.log(error)
        // return res.status(500).send({ error });
      });

    
  };

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler);

  // Wait a while for the subscription to run. (Part of the sample only.)
  setTimeout(() => {
    subscription.removeListener('message', messageHandler);
    console.log(`${messageCount} message(s) received.`);
  }, timeout * 1000);
}
// [END pubsub_subscriber_async_pull]
// [END pubsub_quickstart_subscriber]

function main(
  subscriptionNameOrId = 'dmii2-3',
  timeout = 60
) {
  timeout = Number(timeout);
  listenForMessages(subscriptionNameOrId, timeout);
}

main(...process.argv.slice(2));