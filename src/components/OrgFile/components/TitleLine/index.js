import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import _ from 'lodash';
import classNames from 'classnames';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import { getCurrentTimestampAsText, millisDuration } from '../../../../lib/timestamps';
import { createIsTodoKeywordInDoneState } from '../../../../lib/org_utils';

import { generateTitleLine } from '../../../../lib/export_org';
import AttributedString from '../AttributedString';

class TitleLine extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRef',
      'handleTitleSpanRef',
      'handleTextareaRef',
      'handleTitleClick',
      'handleTextareaBlur',
      'handleTextareaFocus',
      'handleTitleChange',
      'handleTitleFieldClick',
      'handleTodoClick',
      'handleTimestampClick',
      'handleInsertTimestamp',
    ]);

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

    if (prevProps.inEditMode && !this.props.inEditMode) {
      this.props.org.updateHeaderTitle(header.get('id'), this.state.titleValue);
    }

    if (prevProps.header !== this.props.header) {
      this.setState(
        {
          titleValue: this.calculateRawTitle(this.props.header),
        },
        () => this.storeContainerWidth()
      );
    }
  }

  handleRef(div) {
    this.containerDiv = div;
  }

  handleTitleSpanRef(span) {
    this.titleSpan = span;
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
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
    const { header, shouldTapTodoToAdvance, setShouldLogIntoDrawer, onClick } = this.props;

    if (!!onClick) {
      onClick();
      event.stopPropagation();
    } else {
      this.props.org.selectHeader(header.get('id'));

      if (shouldTapTodoToAdvance) {
        this.props.org.advanceTodoState(null, setShouldLogIntoDrawer);
      }
    }
  }

  // Rationale for setTimeout documented in HeaderContent/index.js
  handleTextareaBlur() {
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.props.org.exitEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 200);
  }

  handleTextareaFocus(event) {
    const { header } = this.props;
    const rawTitle = header.getIn(['titleLine', 'rawTitle']);
    if (rawTitle === '') {
      const text = event.target.value;
      event.target.selectionStart = text.length;
      event.target.selectionEnd = text.length;
    }
  }

  handleTitleChange(event) {
    // If the last character typed was a newline at the end, exit edit mode.
    const newTitle = event.target.value;
    const lastCharacter = newTitle[newTitle.length - 1];
    if (
      this.state.titleValue === newTitle.substring(0, newTitle.length - 1) &&
      lastCharacter === '\n'
    ) {
      this.props.org.exitEditMode();
      return;
    }

    this.setState({ titleValue: newTitle });
  }

  handleTitleFieldClick(event) {
    event.stopPropagation();
  }

  handleTimestampClick(timestampId) {
    this.props.base.activatePopup('timestamp-editor', { timestampId });
  }

  handleInsertTimestamp(event) {
    this.setState({ shouldIgnoreBlur: true });

    const { titleValue } = this.state;
    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      titleValue:
        titleValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        titleValue.substring(this.textarea.selectionEnd || insertionIndex),
    });

    this.textarea.focus();

    event.stopPropagation();
  }

  render() {
    const {
      header,
      color,
      hasContent,
      inEditMode,
      shouldDisableActions,
      shouldDisableExplicitWidth,
      todoKeywordSets,
      showClockDisplay,
    } = this.props;
    const { containerWidth } = this.state;

    const isTodoKeywordInDoneState = createIsTodoKeywordInDoneState(todoKeywordSets);
    const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

    const titleLineStyle = {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between'
    };

    const titleStyle = {
      color,
      wordBreak: 'break-word',
    };

    const clockDisplayStyle = {
      color,
      minWidth: '5em',
      textAlign: 'right',
      marginRight: '5px',
    };

    return (
      <div
        className="title-line"
        onClick={this.handleTitleClick}
        ref={this.handleRef}
        style={{ width: shouldDisableExplicitWidth ? '' : containerWidth }}
      >
        {!inEditMode && !!todoKeyword ? (
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

        {inEditMode ? (
          <div className="title-line__edit-container">
            <textarea
              autoFocus
              className="textarea"
              data-testid="titleLineInput"
              rows="3"
              ref={this.handleTextareaRef}
              value={this.state.titleValue}
              onBlur={this.handleTextareaBlur}
              onFocus={this.handleTextareaFocus}
              onChange={this.handleTitleChange}
              onClick={this.handleTitleFieldClick}
            />
            <div
              className="title-line__insert-timestamp-button"
              onClick={this.handleInsertTimestamp}
            >
              <i className="fas fa-plus insert-timestamp-icon" />
              Insert timestamp
            </div>
          </div>
        ) : (
          <div style={{width: '100%'}}>
            <div style={titleLineStyle}>
              <span style={titleStyle} ref={this.handleTitleSpanRef}>
                <AttributedString
                  parts={header.getIn(['titleLine', 'title'])}
                  subPartDataAndHandlers={{
                    onTimestampClick: this.handleTimestampClick,
                    shouldDisableActions,
                  }}
                />
                {!header.get('opened') && hasContent ? '...' : ''}
              </span>
            {showClockDisplay && header.get('totalTimeLoggedRecursive')!==0  ?
              <span style={clockDisplayStyle}>
                {millisDuration(header.get('totalTimeLoggedRecursive'))}
              </span> 
              : null}
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
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    inEditMode:
      state.org.present.get('editMode') === 'title' &&
      state.org.present.get('selectedHeaderId') === ownProps.header.get('id'),
    setShouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    shouldTapTodoToAdvance: state.base.get('shouldTapTodoToAdvance'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    isSelected: state.org.present.get('selectedHeaderId') === ownProps.header.get('id'),
    todoKeywordSets: state.org.present.get('todoKeywordSets'),
    showClockDisplay: state.org.present.get('showClockDisplay'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TitleLine);
