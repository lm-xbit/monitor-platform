import {routerReducer} from 'react-router-redux';
import {combineReducers} from 'redux';

import demo from 'demo/demoReducer';

const rootReducer = combineReducers({
  routing: routerReducer,
  demo
});

export default rootReducer;
