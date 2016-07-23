/*
 <Modal
 link={<a>Open me</a>}
 isOpened={true}
 >
 <div>
 ....
 </div>
 </Modal>

 or

 <Modal link={<span>click to open dialog</span>}>
 <YourComponent />
 </Modal>
 */

import React from 'react';
import Portal from 'libs/react-portal/portal';
import style from './Modal.scss';
import cx from 'classnames';
import _ from 'lodash';

const defaultStyle = {
  width: '80%',
};

let overlayZIndex = 999;
let contentZIndex = 1000;

export default class Modal extends React.Component {
  componentWillUnmount () {
    overlayZIndex--;
    contentZIndex--;
  }

  render () {
    // make a newer modal can overlap on the elder modal
    overlayZIndex++;
    contentZIndex++;
    let {closeOnEsc, closeOnOutsideClick} = this.props;
    if (closeOnEsc === undefined) {
      closeOnEsc = false;
    }
    if (closeOnOutsideClick === undefined) {
      closeOnOutsideClick = false;
    }
    return (
      <Portal
        {...this.props}
        ref="portal"
        closeOnEsc={closeOnEsc}
        closeOnOutsideClick={closeOnOutsideClick}
        openByClickOn={this.props.link}
      >
        <PseudoModal title={this.props.title} content={this.props.children} styleProps={this.props.styleProps}/>
      </Portal>
    );
  }
}

Modal.propTypes = {
  closeOnEsc: React.PropTypes.bool,
  link: React.PropTypes.element,
  children: React.PropTypes.node.isRequired,
  closeOnOutsideClick: React.PropTypes.bool,
  title: React.PropTypes.string,
  isOpened: React.PropTypes.bool,
  styleProps: React.PropTypes.object,
};

const PseudoModal = (props)=> {
  return (
    <div>
      <div className={style.overlay} style={{zIndex: overlayZIndex}}>
      </div>
      <div className={style.content} style={{width: _.get(props, 'styleProps.width', defaultStyle.width), zIndex: contentZIndex}}>
        <div className={cx(style.modalHead, 'clearfix')}>
          <h2 style={{float: 'left'}}>{props.title}</h2>
          <span
            className={style.closeBtn}
            onClick={
              ()=> {
                setTimeout(()=> {
                  props.closePortal();
                }, 0);
              }}
          >
          </span>
        </div>
        <div className={style.userContent}>
          {/* just pass in closePortal Callback  */}
          <div>{React.cloneElement(props.content, {
            closePortal: function () {
              setTimeout(()=> {
                props.closePortal();
              }, 0);
            }
          })}</div>
        </div>
      </div>
    </div>
  );
};

PseudoModal.propTypes = {
  closePortal: React.PropTypes.func,
  content: React.PropTypes.element.isRequired,
  title: React.PropTypes.string,
};

