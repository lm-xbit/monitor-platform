import {createStore, applyMiddleware, compose} from 'redux';
import thunkMiddleware from 'redux-thunk';
import appReducer from './reducers';

export default createStore(
  appReducer,
  NODE_ENV === 'development' // eslint-disable-line
    ? compose(applyMiddleware(thunkMiddleware), window.devToolsExtension ? window.devToolsExtension() : f => f)
    : applyMiddleware(thunkMiddleware)
);
