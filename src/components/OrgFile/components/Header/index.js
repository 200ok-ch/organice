import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { Motion, spring } from 'react-motion';

import './Header.css';

import classNames from 'classnames';
import _ from 'lodash';

import TitleLine from '../TitleLine';
import HeaderContent from '../HeaderContent';

import { headerWithId } from '../../../../lib/org_utils';

class Header extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTouchMove', 'handleTouchStart', 'handleTouchEndOrCanceled',
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

  handleTouchEndOrCanceled(event) {
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
    ) : spring(0);

    const style = {
      paddingLeft: 20 * indentLevel,
      marginLeft,
    };

    const className = classNames('header', {
      'header--selected': isSelected,
    });

    return (
      <Motion style={style}>
        {interpolatedStyle => (
          <div className={className}
               style={interpolatedStyle}
               ref={onRef}
               onTouchStart={this.handleTouchStart}
               onTouchMove={this.handleTouchMove}
               onTouchEnd={this.handleTouchEndOrCanceled}
               onTouchCancel={this.handleTouchEndOrCanceled}>
            <div style={{marginLeft: -16, color}}>{bulletStyle === 'Fancy' ? '●' : '*'}</div>
            <TitleLine header={header}
                       color={color}
                       hasContent={hasContent}
                       isSelected={isSelected} />
            <HeaderContent header={header} />
          </div>
        )}
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

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
