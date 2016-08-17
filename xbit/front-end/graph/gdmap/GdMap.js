import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {updateLocation, loadGdMap} from './GdMapActions';
export class GdMap extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      map: null,

      hot: {
        marker: null,
        range: null,
        circle: null
      }
    };
  }

  componentDidMount () {
    var self = this;
    loadGdMap(function () {
      var map = new window.AMap.Map('map-container');
      map.setZoom(14);

      self.state.map = map;

      updateLocation(map, self.state.hot);

      window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
        var toolBar = new window.AMap.ToolBar();
        var scale = new window.AMap.Scale();
        map.addControl(toolBar);
        map.addControl(scale);
      });

      setInterval(function () {
        updateLocation(map, self.state.hot);
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
