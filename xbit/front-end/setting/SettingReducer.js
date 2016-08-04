import {combineReducers} from 'redux';
import data from './basic/BasicSettingsReducer';
import apps from './apps/AppSettingsReducer';

export default combineReducers({
  data, apps
});
