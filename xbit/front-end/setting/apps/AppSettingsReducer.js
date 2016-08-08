const app = (state, action) => {
  switch (action.type) {
    case 'APP_SETTINGS_ADD':
      return {
        id: action.id,
        text: action.text,
        completed: false
      };
    case 'APP_SETTINGS_UPDATE':
      if (state.id !== action.id) {
        return state;
      }

      return Object.assign({}, state, {
        completed: !state.completed
      });

    default:
      return state;
  }
};

const apps = (state = [], action) => {
  switch (action.type) {
    case 'POPULATE_APP_SETTINGS':
      return action.data;
    case 'APP_SETTINGS_ADD':
      return [
        ...state,
        app(undefined, action)
      ];
    case 'APP_SETTINGS_UPDATE':
      return state.map(item =>
        app(item, action)
      );
    case 'APP_SETTINGS_REMOVE':
      var idx = 0;
      return state.splice(idx, 1);
    default:
      return state;
  }
};

export default apps;
