import {catchError} from 'actions/global/index';
import store from 'store/index';
import _ from 'lodash';

export function handleError (err) {
  if (err.toString() === 'TypeError: Failed to fetch') {
    store.dispatch(catchError(new Error('Can\'t communication with server')));
  }

  if (err.errorType === 'ServerError') {
    console.error(err); // eslint-disable-line
    store.dispatch(catchError(err));
  }
}

export function arrReplace (arr, oriItem, newItem) {
  const index = _.indexOf(arr, oriItem);
  arr.splice(index, 1, newItem);
  return arr;
}
