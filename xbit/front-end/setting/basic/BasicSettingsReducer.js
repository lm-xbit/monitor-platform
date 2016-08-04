const data = (state = {
  username: 'foo',
  email: 'bar@somewhere.com',
  password: 'testpassword'
}, action) => {
  switch (action.type) {
    case 'UPDATE_USERNAME':
      return Object.assign({}, state, {
        username: action.username
      });

    default:
      return state;
  }
};

export default data;
