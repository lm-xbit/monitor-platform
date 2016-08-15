const data = (state = {
  username: '',
  password: '',
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
        password: action.data.password
      });

    case 'UPDATE_BASIC_SETTINGS_FAILURE':
      return state;

    default:
      return state;
  }
};

export default data;
