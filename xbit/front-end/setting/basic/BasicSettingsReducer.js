const data = (state = {
  username: '',
  password: '',
  email: ''
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

    default:
      return state;
  }
};

export default data;
