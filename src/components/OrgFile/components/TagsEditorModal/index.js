import React, { PureComponent, Fragment } from 'react';

import { Droppable, Draggable } from 'react-beautiful-dnd';

import './TagsEditorModal.css';

import _ from 'lodash';
import classNames from 'classnames';

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
      this.props.onChange(tags.set(tagIndex, event.target.value.replace(/\s+/g, '')));
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

  handleAddExistingTag(newTag) {
    return () => {
      const tags = this.props.header.getIn(['titleLine', 'tags']);
      if (tags.includes(newTag)) {
        return;
      }
      this.props.onChange(tags.push(newTag));
    };
  }

  render() {
    const {
      header,
      onClose,
      allTags,
    } = this.props;

    return (
      <div className="modal-container">
        <button className="fas fa-times fa-lg modal-container__close-button"
                onClick={onClose} />

        <h2 className="tags-editor__title">
          Edit tags
        </h2>

        <Droppable droppableId="tags-editor-droppable" type="TAG">
          {(provided, snapshot) => (
            <div className="tags-container"
                 ref={provided.innerRef}
                 {...provided.droppableProps}>
              <Fragment>
                {header.getIn(['titleLine', 'tags']).map((tag, index) => (
                  <Draggable draggableId={`tag--${index}`} index={index} key={index}>
                    {(provided, snapshot) => (
                      <div className={classNames("tag-container", { 'tag-container--dragging': snapshot.isDragging })}
                           ref={provided.innerRef}
                           {...provided.draggableProps}>
                        <input type="text"
                               className="textfield tag-container__textfield"
                               value={tag}
                               onChange={this.handleTagChange(index)} />
                        <div className="tag-container__actions-container">
                          <i className="fas fa-times fa-lg" onClick={this.handleRemoveTag(index)} />
                          <i className="fas fa-bars fa-lg tag-container__drag-handle" {...provided.dragHandleProps} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </Fragment>
            </div>
          )}
        </Droppable>

        <div className="tags-editor__add-new-container">
          <button className="fas fa-plus fa-lg btn btn--circle" onClick={this.handleAddNewTag} />
        </div>

        <hr className="tags-editor__separator" />

        <h2 className="tags-editor__title">
          All tags
        </h2>

        <div className="all-tags-container">
          {allTags.filter(tag => !!tag).map(tag => {
            const className = classNames('all-tags__tag', {
              'all-tags__tag--in-use': header.getIn(['titleLine', 'tags']).includes(tag),
            });

            return (
              <div className={className} key={tag} onClick={this.handleAddExistingTag(tag)}>
                {tag}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
