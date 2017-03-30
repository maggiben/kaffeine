import { createClient } from 'redis'
import { EventEmitter } from 'events'
import config from 'config'
const debug = require('debug')('kaffeine:RedisPubSub')

// create single EventEmitter instance
class RedisEvents extends EventEmitter {
  constructor(...args) {
    super(...args);
  }
}

export default class RedisPubSub {
  constructor (store) {
    let { redis } = config
    this.client = createClient(redis.port, redis.hostname, {})
    this.publisher = createClient(redis.port, redis.hostname, {})
    this.subscriber = createClient(redis.port, redis.hostname, { detect_buffers: true })
    // Event listeners
    this.subscriber.on('message', this.onMessage)
    this.subscriber.on('connect', this.onConnect)
    // Create subscriber
    this.subscriber.subscribe(redis.subscriberName)
    // Class eventEmitter instance
    this.events = new RedisEvents()
  }

  publish (message) {
    let { redis } = config
    this.publisher.publish(redis.subscriberName, message)
  }
  // Feed the data consumer
  onMessage = message => {
    this.events.emit('message', message)
    debug(message)
  }

  onConnect = () => {
    this.events.emit('connect')
    debug('redis client connected')
  }
}
