import Modal from './Modal';
import React from 'react';
import style from './ConfirmBox.scss';
import cx from 'classnames';

export default class ConfirmBox extends React.Component {
  render () {
    return (
      <Modal link={this.props.link} title={this.props.title || 'Confirmation'} styleProps={{width: '400px'}}>
        <Content {...this.props}/>
      </Modal>
    );
  }
}

// here we need to extract this part out, if we inline this part, we can't inject the fn(closePortal).
// In Modal.js we used <div>{React.cloneElement(props.content, {closePortal: props.closePortal})}</div> to inject.
// If we inline below code, the this.props will means outer props (the props at ConfirmBox level), which the ConfirmBox.props.closePortal is not existing.
const Content = (props) => {
  return (
    <div>
      <div>
        {props.children}
      </div>
      <div className={style.buttonsGroup}>
        <button
          className={cx('pure-button', 'pure-button-primary', style.confirmButton)}
          onClick={(e)=> {
            props.fn(e, props.closePortal);
            props.closePortal();
          }}
        >
          Confirm
        </button>

        <button
          className={cx('pure-button', 'pure-button-primary', style.cancleButton)}
          onClick={(e)=> {
            props.closePortal();
          }}
        >
          Cancel
        </button>
      </div>
    </div>);
};

Content.propTypes = {
  closePortal: React.PropTypes.func,
};

ConfirmBox.propTypes = {
  link: React.PropTypes.element.isRequired,
  children: React.PropTypes.node.isRequired,
  title: React.PropTypes.string,
};
