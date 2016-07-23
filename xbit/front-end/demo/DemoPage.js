import React from 'react';
import TodoList from './todos/TodoList';

export default function GraphPage (props) {
  return (
    <div style={{padding: '20px'}}>
      <h4>
        This is demo page for todo list.
      </h4>
      <div style={{width: '400px'}}>
        <TodoList/>
      </div>
    </div>
  );
};

GraphPage.propTypes = {
};

