import React from 'react';
import TodoList from './todos/TodoList';
import Country from './country/Country';

export default function GraphPage (props) {
  return (
    <div style={{padding: '20px'}}>
      <h4>
        This is demo page for todo list. <Country/>
      </h4>

      <div style={{width: '400px'}}>
        <TodoList/>
      </div>
    </div>
  );
};

GraphPage.propTypes = {
};

