export const join = function (id) {
  const options = {
    transports: ['websocket'],
    'force new connection': true,
    'query': {
      'token': chance.hash()
    }
  }

  return new Promise((resolve, reject) => {
    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
    const handleConnect = function () {
      const action = {
        type: 'MESSAGE',
        payload: 'hello !'
      }

      client.once(action.type, function (payload) {
        //console.log(action.type, JSON.stringify(payload,0,2))
        expect(payload).to.be.a('string')
        return resolve()
      })

      // Join the channer where actions are dispatched
      client.emit('join', {
        name: 'notification'
      })

      // Dispatch the action once joined the room
      client.once('joined', function (message) {
        store.dispatch(action)
      })
    }
    // Handle connection
    client.once('connect', handleConnect)
  })
}
