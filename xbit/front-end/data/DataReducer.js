
import {combineReducers} from 'redux';
const locations = (state = [], action) => {
  switch (action.type) {
    case 'DISPLAY_LOCATION':
      return action.locations;
    default:
      return state;
  }
};

const apps = (state = [], action) => {
  switch (action.type) {
    case 'POPULATE_APP_SETTINGS':
      return action.data;
    default:
      return state;
  }
};

export default combineReducers({
  apps, locations
});
