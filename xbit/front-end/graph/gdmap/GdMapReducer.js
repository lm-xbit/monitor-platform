const apps = (state = [], action) => {
  switch (action.type) {
    case 'POPULATE_APP_SETTINGS':
      return action.data;

    default:
      return state;
  }
};

export default apps;
