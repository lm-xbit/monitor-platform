import React from 'react';
import activeComponent from 'react-router-active-component';
import 'commonStyle/index.scss';
import style from './App.scss';

const NavLink = activeComponent('li');

const App = (props) => {
  return (
    <div>
      <div className={style.header}>
        <div className={style.headerItem}>
          <img src={require('resources/assets/images/logo.png')} alt="" height="36px"/>
        </div>
        <div className={style.headerItem}>
          <div>
            <ul className='nav nav-pills'>
              <NavLink to="/graph" activeClassName="active">
                  Graph
              </NavLink>
              <NavLink to='/data' activeClassName="active">
                Data
              </NavLink>
              <NavLink to="/setting" activeClassName="active">Setting</NavLink>
              <NavLink to="/demo" activeClassName="active">Demo</NavLink>
            </ul>
          </div>
        </div>
        <span className={style.logout}>
          <i className="fa fa-sign-out" aria-hidden="true"></i>
          <a href="javascript:;">
            Log out
          </a>
        </span>
      </div>
      <div className={style.contentView}>
        {props.children}
      </div>
    </div>
  );
};

App.propTypes = {
  children: React.PropTypes.node
};

export default App;
