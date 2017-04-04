/*
 * Screen action creators
 * @desc:
 * Author: Benjamin at bmaggi@elementum.com
 * Version: 0.1.0
 */

import * as types from '../constants/ActionTypes'

/* Screens */
export const editScreen = payload => ({ type: types.EDIT_SCREEN, payload })
export const removeScreen = payload => ({ type: types.REMOVE_SCREEN, payload })
export const provisionRequest = payload => ({ type: types.PROVISION_SCREEN_REQUEST, payload })

export function provisionScreen (id, options) {
  return async function (dispatch, getState) {
    return new Promise((resolve, reject) => {
      return resolve(dispatch(provisionRequest(id)))
    })
  }
}
