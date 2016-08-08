import {connect} from 'react-redux';
import React, {PropTypes} from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import BasicSettings from './basic/BasicSettings';
import AppSettings from './apps/AppSettings';

export class SettingPage extends React.Component {
  componentWillMount () {
    console.log(this.props);

    this.props.settings.basic = {
      username: 'foo',
      email: 'bar@somewhere.com',
      password: 'testpassword'
    };

    this.props.settings.apps = [{
      id: 'id1',
      name: 'test',
      type: 'Mobile Tracking',
      key: '1234567'
    }];
  }

  render () {
    return (
      <div style={{padding: '20px'}}>
        <div style={{width: '400px'}}>
          <Tabs>
            <TabList>
              <Tab>Basic Settings</Tab>
              <Tab>Application Settings</Tab>
            </TabList>
            <TabPanel>
              <BasicSettings data={this.props.settings.basic}/>
            </TabPanel>

            <TabPanel>
              <AppSettings apps={this.props.settings.apps}/>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
};

SettingPage.propTypes = {
  settings: React.PropTypes.object
};

export default connect(() => {
  return {
    settings: {}
  };
})(SettingPage);
