import {routerReducer} from 'react-router-redux';
import {combineReducers} from 'redux';

import demo from 'demo/demoReducer';
import settings from 'setting/SettingReducer';

const rootReducer = combineReducers({
  routing: routerReducer,
  demo,
  settings
});

export default rootReducer;
