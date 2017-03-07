import express from 'express'
import uuid from 'uuid/v4'
import Chance from 'chance'

const chance = new Chance()
const router = express.Router()

router.get('/', function(request, response) {
  const { store } = response
  store.dispatch({
    type: 'ADD_SCREEN',
    payload: {
      id: '12345',
      title: 'hello'
    }
  })
  response.json({
    date: new Date(),
    state: store.getState()
  })
})

router.post('/', function(request, response) {
  const { store } = response
  const id = uuid()

  store.dispatch({
    type: 'ADD_SCREEN',
    payload: {
      id: id,
      title: chance.word()
    }
  })
  response.json({
    id: id
  })
})
export default router
