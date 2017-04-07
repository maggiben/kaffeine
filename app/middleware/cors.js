// CORS middleware
export default function (request, response, next) {
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
