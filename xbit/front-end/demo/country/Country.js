import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {lookupCountry} from './CountryAction';

export class Country extends React.Component {
  componentWillMount () {
    console.log('will mount');
    this.props.actions.lookupCountry();
  }

  render () {
    return (
      <span>
        <button className="btn btn-info" onClick={() => this.props.actions.lookupCountry()}>Get country {this.props.countryCode}</button>
      </span>
    );
  }
};

Country.propTypes = {
  countryCode: PropTypes.string,
  actions: React.PropTypes.shape({
    lookupCountry: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  return {
    countryCode: state.demo.countryCode
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({lookupCountry}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Country);
