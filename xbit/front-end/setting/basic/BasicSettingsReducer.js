const data = (state = {}, action) => {
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
