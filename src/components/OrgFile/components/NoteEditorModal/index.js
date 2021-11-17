import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';

import _ from 'lodash';

class NoteEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTextareaRef', 'addNote']);

    this.state = {
      allTags: props.allTags,
    };
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  addNote(note) {
    if (note !== null) note = note.trim();
    if (!note) return;

    this.props.org.addNote(note, new Date());
    this.setState({ note: '' });
  }

  handleNoteFieldClick(event) {
    event.stopPropagation();
  }

  render() {
    return (
      <>
        <h2 className="drawer-modal__title">Add note</h2>
        <div>Enter a note to add to the header:</div>
        <textarea
          autoFocus
          className="textarea drag-handle"
          data-testid="titleLineInput"
          rows="3"
          ref={this.handleTextareaRef}
          value={this.state.note}
          onClick={this.handleNoteFieldClick}
        />
        <button
          className="btn note-editor__done-btn"
          onClick={() => this.addNote(this.textarea.value)}
        >
          Add
        </button>
      </>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(null, mapDispatchToProps)(NoteEditorModal);
