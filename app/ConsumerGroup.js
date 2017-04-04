import { ConsumerGroup, Offset, Client } from 'kafka-node'
import config from 'config'
import { EventEmitter } from 'events'
import * as actions from './actions/ScreenActions'
import * as types from './constants/ActionTypes'

const debug = require('debug')('kaffeine:ConsumerGroup')

const groupOptions = {
  host: 'localhost:2181',
  groupId: 'ExampleTestGroup',
  sessionTimeout: 15000,
  // An array of partition assignment protocols ordered by preference.
  // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
  protocol: ['roundrobin'],
  // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
  // equivalent to Java client's auto.offset.reset
  fromOffset: 'earliest', // default
  // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
  outOfRangeOffset: 'earliest', // default
  autoCommit: false
}

// create single EventEmitter instance
class KafkaEvents extends EventEmitter {
  constructor(...args) {
    super(...args)
  }
}

export default class KafkaConsumerGroup {
  constructor (store) {
    this.client = new Client('localhost:2181')
    this.topic = config.kafka.topic.topicName
    this.partition = config.kafka.topic.partition
    this.messages = new Array()
    this.consumerGroup = new ConsumerGroup(groupOptions, [this.topic])
    this.offset = new Offset(this.client)
    // Store
    this.store = store
    // Consumer events
    this.consumerGroup.once('connect', this.onConnect)
    // Class eventEmitter instance
    this.events = new KafkaEvents()
  }

  startListeners = () => {
    this.consumerGroup.on('message', this.onMessage)
    this.consumerGroup.on('offsetOutOfRange', this.onOffsetOutOfRange)
    this.consumerGroup.on('error', this.onError)
  }

  stopListeners = () => {
    this.consumerGroup.off('message', this.onMessage)
    this.consumerGroup.off('offsetOutOfRange', this.onOffsetOutOfRange)
    this.consumerGroup.off('error', this.onError)
  }

  getLatestOffsets = (topic = this.topic) => {
    return new Promise((resolve, reject) => {
      let { kafka } = config
      this.offset.fetchLatestOffsets([topic], function (error, offsets) {
        if (error) {
          debug(error)
          return reject(error)
        }
        debug('getLatestOffsets:', offsets)
        return resolve(offsets)
      })
    })
  }

  getOffset = (topic = this.topic) => {
    return new Promise((resolve, reject) => {
      this.offset.fetch([{topic, time: -1}], function (error, data) {
        if (error) {
          debug(error)
          return reject(error)
        }
        debug('getOffset:', data)
        return resolve(data)
      })
    })
  }

  // Kafka consumer is connected
  onConnect = () => {
    this.events.emit('connect', this.consumerGroup)
    //this.consumerGroup.setOffset(this.topic, this.partition, 23)
    this.startListeners()
    debug('Consuming Kafka')
  }

  // Feed the data consumer
  onMessage = message => {
    debug('onMessage', JSON.stringify(message, null, 2))
    try {
      let action = JSON.parse(message.value)
      this.events.emit('message', action)
      this.store.dispatch(action)
    } catch (error) {
      debug(error)
      this.store.dispatch({
        type: 'ERROR',
        payload: error,
        error: true
      })
    }
  }

  onError = error => {
    this.events.emit('error', error)
    debug('error', error)
  }

  onOffsetOutOfRange = error => {
    this.events.emit('offsetOutOfRange', error)
    debug('offsetOutOfRange:', error)
  }

  end = (force = false) => {
    return new Promise((resolve, reject) => {
      this.stopListeners()
      this.consumerGroup.close(force, function () {
        return resolve()
      })
    })
  }
}
