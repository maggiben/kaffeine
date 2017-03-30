import { Client, KeyedMessage, Producer } from 'kafka-node'
import config from 'config'
const debug = require('debug')('kaffeine:producer')

export default class KafkaProducer {
  constructor (store) {
    const { kafka } = config
    this.client = new Client(kafka.client.connectionString)
    this.producer = new Producer(this.client, { requireAcks: 1 })
    this.producer.on('message', this.onMessage)
    this.producer.on('error', this.onError)
    this.producer.on('ready', this.ready)
  }

  send = message => {
    const { kafka } = config
    const keyedMessage = new KeyedMessage('keyed', JSON.stringify(message));

    return new Promise((resolve, reject) => {
      this.producer.send([{
        topic: kafka.producer.topic,
        partitions: kafka.producer.partitions,
        messages: keyedMessage,
        attributes: kafka.producer.attributes //0: No compression 1: Compress using GZip 2: Compress using snappy
      }], function (error, result) {
        if(error) {
          debug(error)
          return reject(error);
        }
        return resolve(result)
      })
    })
  }

  ready = () => {
    this.isReady = true;
    debug('producer is ready')
  }

  onError = error => {
    debug('error', error)
  }
}
