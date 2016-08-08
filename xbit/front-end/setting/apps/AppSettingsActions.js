export const addApp = (text) => {
  return {
    type: 'ADD',
    text
  };
};

export const updateApp = (id, key) => {
  return {
    type: 'UPDATE',
    key
  };
};

export const removeApp = (id) => {
  return {
    type: 'REMOVE',
    id
  };
};
