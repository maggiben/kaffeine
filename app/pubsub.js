import { createClient } from 'redis'
import config from 'config'

export default class RedisPubSub {
  constructor (store) {
    let { redis } = config
    this.publisher = createClient(redis.port, redis.hostname, {})
    this.subscriber = createClient(redis.port, redis.hostname, { detect_buffers: true })
    this.subscriber.on('message', this.onMessage)
    this.subscriber.subscribe(redis.subscriberName)
  }

  publish (message) {
    let { redis } = config
    this.publisher.publish(redis.subscriberName, message)
  }
  // Feed the data consumer
  onMessage = message => {
    debug(message);
  }
}
