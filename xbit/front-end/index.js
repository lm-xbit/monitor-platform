import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';

import GraphPage from './graph/GraphPage';
import SettingPage from './setting/SettingPage';
import DataPage from './data/DataPage';

import {Provider} from 'react-redux';
import {Router, Route, browserHistory, hashHistory, IndexRedirect} from 'react-router'; // eslint-disable-line
import {syncHistoryWithStore} from 'react-router-redux';
import store from './app/store.js';

require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('resources/assets/styles/index.css');

let actuallyHistory = NODE_ENV === 'development' ? hashHistory : hashHistory; // eslint-disable-line
const history = syncHistoryWithStore(actuallyHistory, store);

const Xbit = (props) => (  // eslint-disable-line
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRedirect to="/graph"/>
        <Route
          path="/graph"
          component={GraphPage}
        />
        <Route
          path="/data"
          component={DataPage}
        />
        <Route path="/setting"
          component={SettingPage}
        />
      </Route>
    </Router>
  </Provider>
);

ReactDOM.render(
  <Xbit />
  , document.getElementById('app'));
