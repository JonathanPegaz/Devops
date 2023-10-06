require('dotenv').config()
const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
var moment = require('moment');
// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');


const quickstart = async (
  projectId = 'temporaryprojectdmii', // Your Google Cloud Platform project ID
  topicNameOrId = 'dmii2-3', // Name for the new topic to create
  subscriptionName = 'dmii2-3', // Name for the new subscription to create
  ) => {
  // Instantiates a client
  const pubsub = new PubSub({projectId});

  // Creates a new topic
  const topic = await pubsub.topic(topicNameOrId);
  console.log(`Topic ${topic.name} created.`);

  // Creates a subscription on that new topic
  const subscription = await topic.subscription(subscriptionName);

  // Send a message to the topic
  await topic.publishMessage({ data: Buffer.from('Test message!') });
  return topic
}

function route(app) {
  app.post('/zip', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false,
      signedUrls: []
  };

    const topic = await quickstart()
    await topic.publishMessage({data: Buffer.from(req.body.tags)})

    return photoModel
    .getFlickrPhotos(tags, tagmode)
    .then(async photos => {
      ejsLocalVariables.photos = photos;
      ejsLocalVariables.searchResults = true;
      return res.render('index', ejsLocalVariables);
    })
    .catch(error => {
      return res.status(500).send({ error });
    }); 
  });
  app.get('/', async (req, res) => {
    const tags = req.query.tags;
    const tagmode = req.query.tagmode;

    const ejsLocalVariables = {
      tagsParameter: tags || '',
      tagmodeParameter: tagmode || '',
      photos: [],
      searchResults: false,
      invalidParameters: false
    };

    // if no input params are passed in then render the view with out querying the api
    if (!tags && !tagmode) {
      return res.render('index', ejsLocalVariables);
    }

    // validate query parameters
    if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
      ejsLocalVariables.invalidParameters = true;
      return res.render('index', ejsLocalVariables);
    }

    const options = {
      action: 'read',
      expires: moment().add(2, 'days').unix() * 1000
      };
      let storage = new Storage();
      const signedUrls = await storage
      .bucket(process.env.STORAGE_BUCKET)
      .file("public/users/test")
      .getSignedUrl(options);
      ejsLocalVariables.signedUrls = signedUrls
      console.log('poulet', ejsLocalVariables)

    // get photos from flickr public feed api
    return photoModel
      .getFlickrPhotos(tags, tagmode)
      .then(async photos => {
        ejsLocalVariables.photos = photos;
        ejsLocalVariables.searchResults = true;
        return res.render('index', ejsLocalVariables);
      })
      .catch(error => {
        return res.status(500).send({ error });
      });
  });
}

module.exports = route;
