import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {toggleTodo, addTodo} from './TodoActions';

export class TodoList extends React.Component {
  componentWillMount () {
    console.log(this.props);
    this.props.todos.push({
      text: 'foo',
      completed: false,
      id: 2
    });
  }
  render () {
    let input;
    return (
      <div>
        <form onSubmit={e => {
          e.preventDefault();
          if (!input.value.trim()) {
            return;
          }
          this.props.actions.addTodo(input.value);
          input.value = '';
        }}>
          <div className="form-group">
            <input className="form-control" placeholder="Add a new todo" defaultValue={"test"} ref={node => {
              input = node;
            }}/>
          </div>
        </form>
        <ul className="list-group">
          {this.props.todos.map(todo =>
            <li
              onClick={() => this.props.actions.toggleTodo(todo.id)}
              className="list-group-item"
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none'
              }}
            >
              {todo.text}
            </li>
          )}
        </ul>
      </div>
    );
  }
};

TodoList.propTypes = {
  todos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    completed: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    toggleTodo: PropTypes.func.isRequired,
    addTodo: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  return {
    todos: state.demo.todos
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({toggleTodo, addTodo}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TodoList);
