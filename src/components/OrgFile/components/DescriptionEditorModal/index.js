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

    const header = props.header;
    this.state = {
      descriptionValue: header
        ? props.editRawValues
          ? this.calculateRawDescription(header)
          : header.get('rawDescription')
        : '',
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
    if (!header) return;
    if (prevProps.header !== header || prevProps.editRawValues !== editRawValues) {
      this.setState({
        descriptionValue: this.props.editRawValues
          ? this.calculateRawDescription(header)
          : header.get('rawDescription'),
      });
      if (this.textarea) this.textarea.focus();
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

  descriptionModifier(event) {
    // converting leading '* ' to '- ' to avoid converting them to headers
    const {
      target: { value },
    } = event;
    const eachValList = value.split('\n');
    eachValList.forEach((item, index) => {
      if (item.startsWith('* ')) {
        eachValList[index] = '- ' + item.slice(2);
      }
    });
    return eachValList.join('\n');
  }

  handleDescriptionChange(event) {
    this.setState({ descriptionValue: this.descriptionModifier(event) });
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
