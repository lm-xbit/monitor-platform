import {combineReducers} from 'redux';
import basic from './basic/BasicSettingsReducer';
import apps from './apps/AppSettingsReducer';

export default combineReducers({
  basic, apps
});

