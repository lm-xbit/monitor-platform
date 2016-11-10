const data = (state = {
  username: '',
  email: '',
  phone: ''
}, action) => {
  switch (action.type) {
    case 'UPDATE_USERNAME':
      return Object.assign({}, state, {
        username: action.username
      });

    case 'POPULATE_BASIC_SETTINGS':
      return Object.assign({}, state, {
        username: action.data.username,
        email: action.data.email,
        phone: action.data.phone
      });

    case 'UPDATE_BASIC_SETTINGS_FAILURE':
      return state;

    default:
      return state;
  }
};

export default data;
