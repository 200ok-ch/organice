import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Motion, spring } from 'react-motion';

import * as orgActions from '../../../../actions/org';

import './Header.css';

import classNames from 'classnames';
import _ from 'lodash';

import TitleLine from '../TitleLine';
import HeaderContent from '../HeaderContent';

import { headerWithId } from '../../../../lib/org_utils';

class Header extends PureComponent {
  MIN_SWIPE_ACTIVATION_DISTANCE = 80;

  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTouchMove', 'handleTouchStart', 'handleTouchEnd', 'handleTouchCancel',
    ]);

    this.state = {
      touchStartX: null,
      currentTouchX: null,
    };
  }

  handleTouchStart(event) {
    this.setState({ touchStartX: event.changedTouches[0].clientX });
  }

  handleTouchMove(event) {
    this.setState({ currentTouchX: event.changedTouches[0].clientX });
  }

  handleTouchEnd(event) {
    const { touchStartX, currentTouchX } = this.state;

    if (currentTouchX - touchStartX >= this.MIN_SWIPE_ACTIVATION_DISTANCE) {
      this.props.org.advanceTodoState(this.props.header.get('id'));
    }

    this.setState({
      touchStartX: null,
      currentTouchX: null,
    });
  }

  handleTouchCancel() {
    this.setState({
      touchStartX: null,
      currentTouchX: null,
    });
  }

  render() {
    const {
      header,
      color,
      hasContent,
      isSelected,
      bulletStyle,
      focusedHeader,
      onRef,
    } = this.props;

    const indentLevel = !!focusedHeader ? (
      header.get('nestingLevel') - focusedHeader.get('nestingLevel') + 1
    ) : header.get('nestingLevel');

    const { touchStartX, currentTouchX } = this.state;
    const marginLeft = (!!touchStartX && !!currentTouchX) ? (
      currentTouchX - touchStartX
    ) : (
      spring(0)
    );

    const style = {
      paddingLeft: 20 * indentLevel,
      marginLeft,
    };

    const className = classNames('header', {
      'header--selected': isSelected,
    });

    return (
      <Motion style={style}>
        {interpolatedStyle => {
          const swipeActionContainerStyle = {
            width: interpolatedStyle.marginLeft,
            backgroundColor: interpolatedStyle.marginLeft >= this.MIN_SWIPE_ACTIVATION_DISTANCE ? 'green' : 'lightgray',
          };

          return (
            <div className={className}
                 style={interpolatedStyle}
                 ref={onRef}
                 onTouchStart={this.handleTouchStart}
                 onTouchMove={this.handleTouchMove}
                 onTouchEnd={this.handleTouchEnd}
                 onTouchCancel={this.handleTouchCancel}>
              <div className="left-swipe-action-container" style={swipeActionContainerStyle}>
                <i className="fas fa-check left-swipe-action-container__icon" />
              </div>
              <div style={{marginLeft: -16, color}}>{bulletStyle === 'Fancy' ? '●' : '*'}</div>
              <TitleLine header={header}
                         color={color}
                         hasContent={hasContent}
                         isSelected={isSelected} />
              <HeaderContent header={header} />
            </div>
          );
        }}
      </Motion>
    );
  }
}

const mapStateToProps = (state, props) => {
  const focusedHeader = !!state.org.present.get('focusedHeaderId') ? (
    headerWithId(state.org.present.get('headers'), state.org.present.get('focusedHeaderId'))
  ) : null;

  return {
    bulletStyle: state.base.get('bulletStyle'),
    focusedHeader,
  };
};

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
