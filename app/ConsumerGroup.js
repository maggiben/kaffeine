import { ConsumerGroup } from 'kafka-node'
import config from 'config'
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
export default class KafkaConsumerGroup {
  constructor (store) {
    let { kafka } = config
    this.consumerGroup = new ConsumerGroup(groupOptions, [kafka.topic.topicName])
    this.consumerGroup.on('connect', this.onConnect)
    this.consumerGroup.on('message', this.onMessage)
    this.consumerGroup.on('error', this.onError)
  }

  onConnect = () => {
    debug('Consuming Kafka')
  }
  // Feed the data consumer
  onMessage = message => {
    debug(message)
    /*try {
      const command = JSON
    }*/
  }

  onError = error => {
    debug('error', error)
  }
}
