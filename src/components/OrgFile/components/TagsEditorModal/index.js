import React, { PureComponent } from 'react';

import './TagsEditorModal.css';

import _ from 'lodash';

export default class TagsEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRemoveTag',
      'handleAddNewTag',
      'handleTagChange',
    ]);
  }

  handleTagChange(tagIndex) {
    return event => {
      const tags = this.props.header.getIn(['titleLine', 'tags']);
      this.props.onChange(tags.set(tagIndex, event.target.value));
    };
  }

  handleRemoveTag(tagIndex) {
    return () => {
      const tags = this.props.header.getIn(['titleLine', 'tags']);
      this.props.onChange(tags.delete(tagIndex));
    };
  }

  handleAddNewTag() {
    const tags = this.props.header.getIn(['titleLine', 'tags']);
    this.props.onChange(tags.push(''));
  }

  render() {
    const {
      header,
      onClose,
    } = this.props;

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
                     value={tag}
                     onChange={this.handleTagChange(index)} />
              <div className="tag-container__actions-container">
                <i className="fas fa-times fa-lg" onClick={this.handleRemoveTag(index)} />
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
