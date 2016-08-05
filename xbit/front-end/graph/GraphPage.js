import React from 'react';

export default function GraphPage (props) {
  return (
    <div>
      <div style={{ margin: 'auto', width: '1000px', height: '600px' }} id="map-container" >
      </div>
      <div>
        {
          new AMap.Map('map-container')
        }
      </div>
    </div>
  );
};

GraphPage.propTypes = {
};
