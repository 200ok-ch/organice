import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import _ from 'lodash';
import classNames from 'classnames';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import { createIsTodoKeywordInDoneState } from '../../../../lib/org_utils';

import { generateTitleLine } from '../../../../lib/export_org';
import AttributedString from '../AttributedString';

class TitleLine extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTitleClick', 'handleTodoClick', 'handleTimestampClick']);

    this.state = {
      titleValue: this.calculateRawTitle(props.header),
      containerWidth: null,
      shouldIgnoreBlur: false,
    };
  }

  storeContainerWidth() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentDidMount() {
    this.storeContainerWidth();
  }

  componentDidUpdate(prevProps) {
    const { header } = this.props;

    if (prevProps.header !== header) {
      this.setState(
        {
          titleValue: this.calculateRawTitle(header),
        },
        () => this.storeContainerWidth()
      );
    }
  }

  calculateRawTitle(header) {
    return generateTitleLine(header.toJS(), false);
  }

  handleTitleClick() {
    const { header, hasContent, isSelected, onClick, closeSubheadersRecursively } = this.props;

    if (!!onClick) {
      onClick();
    } else {
      if (hasContent && (!header.get('opened') || isSelected)) {
        this.props.org.toggleHeaderOpened(header.get('id'), closeSubheadersRecursively);
      }

      this.props.org.selectHeader(header.get('id'));
    }
  }

  handleTodoClick(event) {
    const {
      header,
      shouldTapTodoToAdvance,
      setShouldLogIntoDrawer,
      setShouldLogDone,
      onClick,
    } = this.props;

    if (!!onClick) {
      onClick();
      event.stopPropagation();
    } else {
      this.props.org.selectHeader(header.get('id'));

      if (shouldTapTodoToAdvance) {
        this.props.org.advanceTodoState(null, setShouldLogIntoDrawer, setShouldLogDone);
      }
    }
  }

  handleTitleFieldClick(event) {
    event.stopPropagation();
  }

  handleTimestampClick(timestampId) {
    this.props.base.activatePopup('timestamp-editor', {
      headerId: this.props.header.get('id'),
      timestampId,
    });
  }

  render() {
    const {
      header,
      color,
      hasContent,
      shouldDisableActions,
      shouldDisableExplicitWidth,
      todoKeywordSets,
      addition,
    } = this.props;
    const { containerWidth } = this.state;

    const isTodoKeywordInDoneState = createIsTodoKeywordInDoneState(todoKeywordSets);
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

    const titleStyle = {
      color,
      wordBreak: 'break-word',
    };

    const additionStyle = {
      color,
      minWidth: '5em',
      textAlign: 'right',
      marginRight: '2em',
      whiteSpace: 'nowrap',
    };

    return (
      <div
        className="title-line"
        onClick={this.handleTitleClick}
        style={{ width: shouldDisableExplicitWidth ? '' : containerWidth }}
      >
        {!!todoKeyword ? (
          <span
            // INFO: Instead of `todoKeyword.toLowerCase()` it would
            // be best to render todo-keyword--done if the keyword is
            // the last of a keywordSet. Then it would get rendered
            // with the appropriate color, no matter what the keyword
            // is.
            // Relevant issue: https://github.com/200ok-ch/organice/issues/16
            className={classNames(
              'todo-keyword',
              isTodoKeywordInDoneState(todoKeyword) ? 'todo-keyword--done-state' : null
            )}
            onClick={this.handleTodoClick}
          >
            {todoKeyword}
          </span>
        ) : (
          ''
        )}

        {
          <div style={{ width: '100%' }}>
            <div className="title-line-text">
              <span style={titleStyle}>
                <AttributedString
                  parts={header.getIn(['titleLine', 'title'])}
                  subPartDataAndHandlers={{
                    onTimestampClick: this.handleTimestampClick,
                    shouldDisableActions,
                  }}
                />
                {!header.get('opened') && hasContent ? '...' : ''}
              </span>
              {addition ? <span style={additionStyle}>{addition}</span> : null}
            </div>
            {header.getIn(['titleLine', 'tags']).size > 0 && (
              <div>
                {header
                  .getIn(['titleLine', 'tags'])
                  .toSet()
                  .toList()
                  .filter((tag) => !!tag)
                  .map((tag) => (
                    <div className="header-tag" key={tag}>
                      {tag}
                    </div>
                  ))}
              </div>
            )}
          </div>
        }
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path]);
  return {
    setShouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    setShouldLogDone: state.base.get('shouldLogDone'),
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    isSelected: file.get('selectedHeaderId') === ownProps.header.get('id'),
    todoKeywordSets: file.get('todoKeywordSets'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleLine);
