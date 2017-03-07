import { Client, Offset, Consumer } from 'kafka-node'
import config from 'config'
const debug = require('debug')('kaffeine:consumer')

export default class KafkaConsumer {
  constructor (store) {
    let { kafka } = config
    this.client = new Client(kafka.client.connectionString)
    this.offset = new Offset(this.client)
    this.consumer = new Consumer(this.client, [{topic: kafka.topic.topicName}], kafka.consumer)
    this.consumer.on('message', this.onMessage)
    this.consumer.on('error', this.onError)
    this.consumer.on('offsetOutOfRange', this.onOffsetOutOfRange)
  }

  // Feed the data consumer
  onMessage = message => {
    debug(message.value);
  }

  onError = error => {
    debug('error', error)
  }

  // If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
  onOffsetOutOfRange = topic => {
    topic.maxNum = 2;
    this.offset.fetch([topic], function (error, offsets) {
      if (error) {
        return debug('error', error)
      }
      var min = Math.min(offsets[topic.topic][topic.partitions])
      consumer.setOffset(topic.topic, topic.partitions, min)
    })
  }
}
