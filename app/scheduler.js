import config from 'config'
import { EventEmitter } from 'events'
const debug = require('debug')('kaffeine:scheduler')

const pub = createClient(config.redis.port, config.redis.hostname, {
  //auth_pass: config.redis.credentials.password
})
const sub = createClient(config.redis.port, config.redis.hostname, {
  detect_buffers: true,
  //auth_pass: config.redis.credentials.password
})

class SchedulerEvents extends EventEmitter {
  constructor(...args) {
    super(...args);
  }
}


class Scheduler {
  constructor(store) {
    this.store = store
    this.events = new SchedulerEvents()
  }
  pub = action => {
    this.store.dispatch(action)
  }
  sub = (type, callback) => {
    this.store.addActionListener(type, callback)
  }
}

export default class QueryScheduler extends Scheduler {
  constructor(...args) {
    super(...args)
    setInterval(this.pub, 1000 * 60 * 10) // 10 minutes interval
  }
}
