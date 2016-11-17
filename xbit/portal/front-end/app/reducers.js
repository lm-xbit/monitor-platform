import {routerReducer} from 'react-router-redux';
import {combineReducers} from 'redux';

import settings from 'setting/SettingReducer';
import datapage from 'data/DataReducer';
import graph from 'graph/GraphReducer';

const rootReducer = combineReducers({
  routing: routerReducer,
  settings,
  datapage,
  graph
});

export default rootReducer;