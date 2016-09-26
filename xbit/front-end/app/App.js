import React from 'react';
import activeComponent from 'react-router-active-component';
import 'common/style/index.scss';
import style from './App.scss';

const logoSource = 'assets/images/logo.png'; // require('resources/assets/images/logo.png');
console.log('Logo source: ' + logoSource);

const NavLink = activeComponent('li');
console.log('Style: ' + style.headerItem, style);

const App = (props) => {
  return (
    <div style={{height: '100%'}}>
      <div className={style.header}>
        <div className={style.headerItem}>
          <img src={logoSource} alt="" height="36px"/>
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
          <a href="/logout">
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
