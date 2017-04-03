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
  /**
   * RedisStore constructor.
   *
   * @param {String|Object} options
   * @api public
   */
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

  /**
   * Get an entry.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */
  get = key => {
    return Promise((reject, resolve) => {
      this.client.get(ley, (error, data) => {
        if (error) return reject(error)
        if (!data) return reject()
        try {
          return resolve(JSON.parse(data.toString()))
        } catch (error) {
          return reject(error)
        }
      })
    })
  }

  /**
   * Set an entry.
   *
   * @param {String} key
   * @param {Mixed} val
   * @param {Number} ttl
   * @param {Function} fn
   * @api public
   */
  set = (key, value, ttl) => {
    return Promise((resolve, reject) => {
      try {
        value = JSON.stringify(value)
      } catch (error) {
        return reject(error);
      }
      if (-1 === ttl) {
        this.client.set(k, val, cb);
      } else {
        this.client.setex(k, (ttl || 60), val, cb);
      }
    })
  }

  onConnect = () => {
    this.events.emit('connect')
    debug('redis client connected')
  }
}
