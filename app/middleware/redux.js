export default function (request, response, next) {
  response.store = store
  return next()
}
