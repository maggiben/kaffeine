import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import config from 'config'
import { Socket, ScreenSocket } from './socket'
import { api } from './routes'
import KafkaConsumer from './consumer'
import KafkaConsumerGroup from './ConsumerGroup'
import RedisPubSub from './pubsub'
import configureStore from './stores/configureStore'
const debug = require('debug')('kaffeine:main')

// CORS middleware
const allowCrossDomain = function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept, token')
  response.header('Access-Control-Allow-Methods', 'OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT')

  // intercept OPTIONS method
  if ('OPTIONS' === request.method) {
    response.status(200).end()
  }
  else {
    return next()
  }
}

// Store
const store = configureStore()
const reduxMiddleware = function (request, response, next) {
  response.store = store
  return next()
}

const removeActionListener = store.addActionListener('ADD_SCREEN', () => {
  //console.log('track', 'ADD_SCREEN');
});

// Globals
const app = express()

// App middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser())
app.use(allowCrossDomain)
app.use(reduxMiddleware)

// App Rutes
app.use('/api', api);

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
