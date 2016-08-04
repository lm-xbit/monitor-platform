import React from 'react';
import BasicSettings from './basic/BasicSettings';
// import AppSettings from './apps/AppSettings';

export default function SettingPage (props) {
  return (
    <div style={{padding: '20px'}}>
      <h4>
        Basic Settings
      </h4>
      <div style={{width: '400px'}}>
        <BasicSettings/>
      </div>
      <h4>
        Manage Applications
      </h4>
    </div>
  );
};

SettingPage.propTypes = {};

