import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import config from 'config'
import { Socket, ScreenSocket } from './socket'
import { api, screen } from './routes'
import { cors } from './middleware'
import KafkaConsumer from './consumer'
import KafkaConsumerGroup from './ConsumerGroup'
import RedisPubSub from './pubsub'
import configureStore from './stores/configureStore'
const debug = require('debug')('kaffeine:main')

// Store
export const store = configureStore()

const reduxMiddleware = function (request, response, next) {
  response.store = store
  return next()
}

// Globals
const app = express()

// App middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())
app.use(cors)
app.use(reduxMiddleware)

// App Rutes
app.use('/api', api)
app.use('/screen', screen)

// App Server
export const server = app.listen(config.service.port, function () {
  const host = server.address().address
  const port = server.address().port
  debug(`Runner app listening at ${host}:${port}'`)
})

const socket = new ScreenSocket(server, store, '/screen')
//const kafkaConsumer = new KafkaConsumer(store)
const kafkaConsumerGroup = new KafkaConsumerGroup(store)
const redisPubSub = new RedisPubSub(store)


// Test all services
Promise.all([function () {
  return new Promise((resolve, reject) => {
    kafkaConsumerGroup.events.once('connect', function () {
      return resolve()
    })
  })
}, function () {
  return new Promise((resolve, reject) => {
    redisPubSub.events.once('connect', function () {
      return resolve()
    })
  })
}]).then(function () {
  setupListeners()
  debug('Services online')
})


const getMessages = async function () {
  console.log('connected')
  let offset = await kafkaConsumerGroup.getLatestOffsets();
  let data = await kafkaConsumerGroup.getOffset()
  let index = offset[config.kafka.topic.topicName][config.kafka.topic.partition];
}


const setupListeners = function() {
  kafkaConsumerGroup.events.once('connect', getMessages)
}



// Gracefully Shuts down
/*
process.on('SIGTERM', function () {
  console.log('SIGTERM')
  server.close(function () {
    process.exit(0)
  })
})
process.on('SIGINT', function() {
  console.log('SIGINT')
  server.close(function () {
    process.exit(0)
  })
})
*/
export default app
