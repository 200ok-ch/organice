import React, { PureComponent } from 'react';

import { connect } from 'react-redux';

import './stylesheet.css';

import _ from 'lodash';

import { isMobileBrowser } from '../../../../lib/browser_utils';
import { createRawDescriptionText } from '../../../../lib/export_org';
import { getCurrentTimestampAsText } from '../../../../lib/timestamps';

class DescriptionEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTextareaRef', 'handleDescriptionChange', 'handleInsertTimestamp']);

    this.state = {
      descriptionValue: props.editRawValues
        ? this.calculateRawDescription(props.header)
        : props.header.get('rawDescription'),
      editorDescriptionHeightValue: props.editorDescriptionHeightValue
        ? props.editorDescriptionHeightValue
        : '8',
    };
  }

  componentDidMount() {
    this.props.setPopupCloseActionValuesAccessor(() => [this.state.descriptionValue]);
  }

  componentDidUpdate(prevProps) {
    const { header, editRawValues } = this.props;
    if (prevProps.header !== header || prevProps.editRawValues !== editRawValues) {
      this.setState({
        descriptionValue: this.props.editRawValues
          ? this.calculateRawDescription(header)
          : header.get('rawDescription'),
      });
      this.textarea.focus();
    }
  }

  calculateRawDescription(header) {
    // This generates the text that appears in the description text field.
    const dontIndent = this.props.dontIndent;
    return createRawDescriptionText(header, false, dontIndent);
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  handleDescriptionChange(event) {
    this.setState({ descriptionValue: event.target.value });
  }

  handleInsertTimestamp() {
    const { descriptionValue } = this.state;
    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      descriptionValue:
        descriptionValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        descriptionValue.substring(this.textarea.selectionEnd || insertionIndex),
    });
    this.textarea.focus();
  }

  render() {
    return (
      <>
        <h2 className="drawer-modal__title">
          {this.props.editRawValues ? 'Edit full description' : 'Edit description'}
        </h2>

        <div className="header-content__edit-container">
          <textarea
            autoFocus
            className="textarea drag-handle"
            rows={isMobileBrowser ? '8' : this.state.editorDescriptionHeightValue}
            ref={this.handleTextareaRef}
            value={this.state.descriptionValue}
            onChange={this.handleDescriptionChange}
          />
          <div
            className="header-content__insert-timestamp-button"
            onClick={this.handleInsertTimestamp}
          >
            <i className="fas fa-plus insert-timestamp-icon" />
            Insert timestamp
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const editorDescriptionHeightValue = state.base.get('editorDescriptionHeightValue');
  return {
    editorDescriptionHeightValue,
  };
};

export default connect(mapStateToProps)(DescriptionEditorModal);
