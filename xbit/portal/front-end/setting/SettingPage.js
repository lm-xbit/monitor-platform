import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import BasicSettings from './basic/BasicSettings';
import AppSettings from './apps/AppSettings';

export default class SettingPage extends React.Component {
  render () {
    return (
      <div style={{padding: '20px'}}>
        <div>
          <Tabs>
            <TabList>
              <Tab>Basic Settings</Tab>
              <Tab>Application Settings</Tab>
            </TabList>
            <TabPanel>
              <BasicSettings/>
            </TabPanel>

            <TabPanel>
              <AppSettings/>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
};