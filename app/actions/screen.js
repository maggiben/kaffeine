/*
 * Screen action creators
 * @desc:
 * Author: Benjamin at bmaggi@elementum.com
 * Version: 0.1.0
 */

import {
  PROVISION_SCREEN,
  EDIT_SCREEN,
  REMOVE_SCREEN
} from '../constants/ActionTypes'

/* Screens */
export const editScreen = payload => ({ type: EDIT_SCREEN, payload })
export const removeScreen = payload => ({ type: REMOVE_SCREEN, payload })

export function provisionScreen (id, options) {
  return async function (dispatch, getState) {

  }
}
