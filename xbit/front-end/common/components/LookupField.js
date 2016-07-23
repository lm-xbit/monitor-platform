/**
 * Lookup Field component
 * props:
 *

 * value - initialValue
 * itemKey - which key of item should we use, default is "name"
 * width - width of lookup field, default is 100%
 * maxItem - how many item to show, default is 10

 * items - array for items to render, default is []
 if we have static items to render, set static items here, and use default doRequest prop

 * doRequest - doRequest(inputValue, callbackToExecuteResponse) is a function which like this:

 doRequest = (inputValue, cb) => {
      fetchAutoComplete('ds1').then((res)=> {cb(res.items)});
    }

 * menuStyle - styles for menu, has default value

 * placeholder
 * renderMenu - renderMenu(items, value, style, autoCompleteComponent) is a function
 to render dropdown menu, has default value

 * renderItem -  renderItem(item, isHighlighted, style, autoCompleteComponent) is a
 function to render dropdown item, has default value

 * disabled - bool
 */

import React from 'react';
import Autocomplete from 'libs/Autocomplete.jsx';
import _ from 'lodash';
import classNames from 'classnames';

const styles = {
  item: {
    cursor: 'pointer',
    padding: '5px .4em',
    minHeight: '0px',
    fontWeight: '600',
    color: 'black',
    lineHeight: '1.5',
    fontSize: '14px',
  },

  highlightedItem: {
    cursor: 'default',
    fontWeight: 'bold',
    border: 'none',
    background: '#e1e1e1',
  },

  searchingTipItem: {
    fontWeight: '400',
    color: 'rgb(119, 119, 119)'
  },

  suggestedTipItem: {
    fontWeight: '400',
    color: 'rgb(119, 119, 119)',
    cursor: 'auto',
  },

  noMatchTipItem: {
    fontWeight: '400',
    color: 'rgb(119, 119, 119)'
  },

  tooMuchTipItem: {
    fontWeight: '400',
    color: 'rgb(119, 119, 119)'
  },

  menuStyle: {
    zIndex: '2000',
    borderRadius: '3px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    padding: '2px',
    position: 'absolute',
    overflow: 'auto',
    background: 'white',
    maxHeight: Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / 2) + 'px'
  },

  wrapperStyle: {
    width: '100%',
  },
};

function renderItem (item, isHighlighted, style, autoCompleteComponent) {
  let itemKey = autoCompleteComponent.props.itemKey;
  let markedName = item[itemKey];
  if (autoCompleteComponent.props.value) {
    markedName = item[itemKey].replace(new RegExp(_.escapeRegExp(autoCompleteComponent.props.value), 'gi'), function (matchedTerm) {
      return `<span style="font-weight: normal">${matchedTerm}</span>`;
    });
  }

  return (
    <div
      style={isHighlighted ? Object.assign({}, styles.highlightedItem, styles.item) : styles.item}
      key={item[itemKey]}
      dangerouslySetInnerHTML={(()=>{ // eslint-disable-line
        return {__html: markedName};
      })()}
    />
  );
}

function renderMenu (items, value, style, autoCompleteComponent) {
  const itemCount = items.length;
  items.unshift(
    <div className={'searchingTipItem'}
         style={Object.assign({display: autoCompleteComponent.state.loading ? 'block' : 'none'}, styles.item, styles.searchingTipItem)}
    >
      <span>
        Searching for suggestions...
      </span>
    </div>);

  if (autoCompleteComponent.props.items.length > autoCompleteComponent.props.maxItem) {
    items.push(
      <div className={'tooMuchTipItem'}
           style={Object.assign({}, styles.item, styles.tooMuchTipItem)}
      >
        Keep typing to refine results
      </div>
    );
  }

  if (itemCount > 0) {
    items.unshift(
      <div className={'suggestedTipItem'}
           style={Object.assign({display: autoCompleteComponent.state.loading ? 'none' : 'block'}, styles.item, styles.suggestedTipItem)}
      >
        Suggested Results
      </div>
    );
    return (
      <div
        style={{...style, ...autoCompleteComponent.props.menuStyle}}
        children={items}
      />
    );
  } else {
    items.push(
      <div className={'noMatchTipItem'}
           style={Object.assign({display: autoCompleteComponent.state.loading ? 'none' : 'block'}, styles.item, styles.noMatchTipItem)}
      >
        No matching results found
      </div>
    );
    return (
      <div style={{...style, ...autoCompleteComponent.props.menuStyle}}
           children={items}
      >
      </div>
    );
  }
}

const debouncedOnChange = _.debounce(function (event, value) {
  this.refs.autocomplete.setState({loading: true});
  this.props.doRequest(value, (items) => {
    this.setState({items: items});
    this.refs.autocomplete.setState({loading: false});
  });
}, 300);

export default class LookupField extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      items: this.props.items || []
    };
  }

  componentDidMount () {
    this.props.doRequest('', (items) => {
      this.setState({items: items}); // eslint-disable-line
      this.refs.autocomplete.setState({loading: false});
    });
  }

  getValue () {
    return this.refs.autocomplete.props.value;
  }

  onChange (event, value) {
    this.props.onChange(value);
    debouncedOnChange.apply(this, [event, value]);
  }

  render () {
    return (
      <div
        className={classNames('lm-lookup-field', 'styled-lookup')}
        style={{position: 'relative'}}
      >
        <Autocomplete
          ref="autocomplete"
          value={this.props.value}
          items={this.state.items}
          getItemValue={(item) => item.value}
          onChange={this.onChange.bind(this)}
          onSelect={this.props.onSelect}
          renderMenu={this.props.renderMenu}
          renderItem={this.props.renderItem}
          width={this.props.width}
          maxItem={this.props.maxItem}
          menuStyle={this.props.menuStyle}
          wrapperStyle={this.props.wrapperStyle}
          itemKey={this.props.itemKey}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
        />
        <span className={"icons24 handle"}>
        </span>
      </div>);
  }
}

LookupField.propTypes = {
  itemKey: React.PropTypes.string,
  width: React.PropTypes.string,
  maxItem: React.PropTypes.number,
  doRequest: React.PropTypes.func,
  menuStyle: React.PropTypes.object,
  renderMenu: React.PropTypes.func,
  renderItem: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  placeholder: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  items: React.PropTypes.array,
  wrapperStyle: React.PropTypes.object,
  onSelect: React.PropTypes.func,
  value: React.PropTypes.any,
};

LookupField.defaultProps = {
  itemKey: 'name',
  width: '100%',
  maxItem: 10,
  items: [],
  doRequest: (inputValue, cb) => {
    cb(this.props.items.filter((item) => {
      item.name.indexOf(inputValue.toLowerCase()) !== -1;
    }));
  },
  menuStyle: styles.menuStyle,
  wrapperStyle: styles.wrapperStyle,
  renderMenu: renderMenu,
  renderItem: renderItem,
  onFocus: (event, value)=>{},
  onBlur: (event, value)=>{},
};
