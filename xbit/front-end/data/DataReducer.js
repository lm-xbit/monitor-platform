const locations = (state = '', action) => {
  switch (action.type) {
    case 'DISPLAY_LOCATION':
      return action.locations;
    default:
      return state;
  }
};

export default locations;
