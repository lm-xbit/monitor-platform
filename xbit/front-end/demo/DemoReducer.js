import {combineReducers} from 'redux';
import todos from './todos/TodoReducer';
import countryCode from './country/CountryReducer';

export default combineReducers({
  todos,
  countryCode
});
