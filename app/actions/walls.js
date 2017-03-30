/*
 * Wall Action Creators
 * @desc:
 * Author: Benjamin at bmaggi@elementum.com
 * Version: 0.1.0
 */

import {
  CREATE_WALL,
  EDIT_WALL,
  REMOVE_WALL
} from '../constants/ActionTypes'

/* Walls */
export const editWall = payload => ({ type: EDIT_WALL, payload })
export const removeWall = payload => ({ type: REMOVE_WALL, payload })


export function createWall (id, options) {
  return async function (dispatch, getState) {

  }
}
