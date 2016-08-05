import React from 'react';

export class GraphPage extends React.Component {
  componentDidMount () {
    var map = new window.AMap.Map('map-container');
  }

  render () {
    return (
      <div>
        <div style={{ margin: 'auto', width: '1000px', height: '600px' }} id="map-container" >
        </div>
      </div>
    );
  }
};

GraphPage.propTypes = {
};

export default GraphPage;
