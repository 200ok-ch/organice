import React, { PureComponent } from 'react';

import './TagsEditorModal.css';

import _ from 'lodash';

export default class TagsEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRemoveTag',
      'handleAddNewTag',
    ]);
  }

  handleRemoveTag() {
    console.log('remove');
  }

  handleAddNewTag() {
    console.log('add');
  }

  render() {
    const {
      header,
      onClose,
    } = this.props;

    // TODO: kill this.
    console.log("header = ", header.toJS().titleLine.tags);

    return (
      <div className="modal-container">
        <button className="fas fa-times fa-lg modal-container__close-button"
                onClick={onClose} />

        <h2 className="tags-editor__title">
          Edit tags
        </h2>

        <div className="tags-container">
          {header.getIn(['titleLine', 'tags']).map((tag, index) => (
            <div className="tag-container" key={index}>
              <input type="text"
                     className="textfield tag-container__textfield"
                     value={tag} />
              <div className="tag-container__actions-container">
                <i className="fas fa-times fa-lg" />
                <i className="fas fa-bars fa-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="tags-editor__add-new-container">
          <button className="fas fa-plus fa-lg btn btn--circle" onClick={this.handleAddNewTag} />
        </div>
      </div>
    );
  }
}
