const kafka = require('kafka-node');
const Producer = kafka.Producer;
const KeyedMessage = kafka.KeyedMessage;
const Client = kafka.Client;
const client = new Client('localhost:2181');
const argv = require('minimist')(process.argv.slice(2));
var topic = argv.topic || 'screen-broadcast';
var p = argv.p || 0;
var a = argv.a || 0;
const producer = new Producer(client, { requireAcks: 1 });
const Chance = require('chance');
const chance = new Chance()

producer.on('ready', function () {
  var message = {
    type: 'PROVISION_SCREEN_REQUEST',
    payload: {
      queryId: chance.hash(),
      date: new Date().toString(),
      data: chance.sentence()
    }
  };

  var keyedMessage = new KeyedMessage('keyed', JSON.stringify(message));

  producer.send([{
    topic: topic,
    partitions: p,
    messages: keyedMessage,
    attributes: 0 //0: No compression 1: Compress using GZip 2: Compress using snappy
  }], function (err, result) {
    console.log(err || result);
    process.exit();
  });
});

producer.on('error', function (err) {
  console.log('error', err);
});
