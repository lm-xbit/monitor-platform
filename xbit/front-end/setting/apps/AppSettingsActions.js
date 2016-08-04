let nextTodoId = 0;
export const addTodo = (text) => {
  return {
    type: 'MODIFY',
    id: nextTodoId++,
    text
  };
};

export const toggleTodo = (id) => {
  return {
    type: 'TOGGLE_TODO',
    id
  };
};
