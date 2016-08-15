import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {getLocation, loadGdMap} from './GdMapActions';
export class GdMap extends React.Component {
  componentDidMount () {
    loadGdMap(function () {
      var map = new window.AMap.Map('map-container');
      getLocation(map);
      window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
        var toolBar = new window.AMap.ToolBar();
        var scale = new window.AMap.Scale();
        map.addControl(toolBar);
        map.addControl(scale);
      });
      setInterval(function () {
        map.clearMap();
        getLocation(map);
      }, 3000); }
    );
  };
  render () {
    return (
      <div style={{ margin: 'auto', width: '1000px', height: '600px' }} id="map-container" >
      </div>
    );
  };
};

GdMap.propTypes = {

};

export default connect()(GdMap);
