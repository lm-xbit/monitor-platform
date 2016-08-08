const app = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return {
        id: action.id,
        text: action.text,
        completed: false
      };
    case 'UPDATE':
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
    case 'ADD':
      return [
        ...state,
        app(undefined, action)
      ];
    case 'UPDATE':
      return state.map(item =>
        app(item, action)
      );
    case 'REMOVE':
      var idx = 0;
      return state.splice(idx, 1);
    default:
      return state;
  }
};

export default apps;
