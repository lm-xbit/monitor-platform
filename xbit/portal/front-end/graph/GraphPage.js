import React from 'react';
import GdMap from './gdmap/GdMap';

export class GraphPage extends React.Component {
  render () {
    return (
      <GdMap />
    );
  }
};

GraphPage.propTypes = {
};

export default GraphPage;