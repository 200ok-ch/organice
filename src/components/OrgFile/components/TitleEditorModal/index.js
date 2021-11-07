import React, { PureComponent } from 'react';

import './stylesheet.css';

import _ from 'lodash';

import { generateTitleLine } from '../../../../lib/export_org';
import { getCurrentTimestampAsText } from '../../../../lib/timestamps';

export default class TitleEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTextareaRef',
      'handleTextareaFocus',
      'handleTitleChange',
      'handleTitleFieldClick',
      'handleInsertTimestamp',
    ]);

    this.state = {
      titleValue: this.calculateRawTitle(props.header),
    };
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  componentDidMount() {
    this.props.setPopupCloseActionValuesAccessor(() => [this.state.titleValue]);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.header !== this.props.header) {
      this.setState({
        titleValue: this.calculateRawTitle(this.props.header),
      });
    }
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
      this.props.onClose(newTitle);
      return;
    }

    this.setState({ titleValue: newTitle });
  }

  handleTitleFieldClick(event) {
    event.stopPropagation();
  }

  calculateRawTitle(header) {
    return generateTitleLine(header.toJS(), false);
  }

  handleInsertTimestamp(event) {
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
    return (
      <>
        <h2 className="drawer-modal__title">Edit title</h2>

        <div className="title-line__edit-container">
          <textarea
            autoFocus
            className="textarea"
            data-testid="titleLineInput"
            rows="3"
            ref={this.handleTextareaRef}
            value={this.state.titleValue}
            onFocus={this.handleTextareaFocus}
            onChange={this.handleTitleChange}
            onClick={this.handleTitleFieldClick}
          />
          <div className="title-line__insert-timestamp-button" onClick={this.handleInsertTimestamp}>
            <i className="fas fa-plus insert-timestamp-icon" />
            Insert timestamp
          </div>
        </div>
      </>
    );
  }
}