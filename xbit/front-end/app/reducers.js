import {routerReducer} from 'react-router-redux';
import {combineReducers} from 'redux';

import demo from 'demo/DemoReducer';
import settings from 'setting/SettingReducer';
import datapage from 'data/DataReducer';

const rootReducer = combineReducers({
  routing: routerReducer,
  demo,
  settings,
  datapage
});

export default rootReducer;
