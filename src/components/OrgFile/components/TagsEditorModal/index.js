import React, { PureComponent, Fragment } from 'react';

import { Droppable, Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import _ from 'lodash';
import classNames from 'classnames';

export default class TagsEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleRemoveTag', 'handleAddNewTag', 'handleTagChange']);

    this.state = {
      allTags: props.allTags,
    };
  }

  componentDidUpdate(prevProps) {
    const prevTags = prevProps.header.getIn(['titleLine', 'tags']);
    const currentTags = this.props.header.getIn(['titleLine', 'tags']);
    if (prevTags.size === currentTags.size - 1 && currentTags.last() === '') {
      if (this.lastTextfield) {
        this.lastTextfield.focus();
      }
    }
  }

  handleTagChange(tagIndex) {
    return (event) => {
      const tags = this.props.header.getIn(['titleLine', 'tags']);
      this.props.onChange(tags.set(tagIndex, event.target.value.replace(/(\s+|:)/g, '')));
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

  handleExistingTagClick(newTag) {
    return () => {
      const tags = this.props.header.getIn(['titleLine', 'tags']);
      if (tags.includes(newTag)) {
        this.props.onChange(tags.filter((tag) => tag !== newTag));
      } else {
        this.props.onChange(tags.push(newTag));
      }
    };
  }

  render() {
    const { header, onClose } = this.props;
    const { allTags } = this.state;

    const headerTags = header.getIn(['titleLine', 'tags']);

    return (
      <>
        <h2 className="drawer-modal__title">Edit tags</h2>

        <datalist id="drawer-modal__datalist-tag-names">
          {allTags.map((tagName, idx) => (
            <option key={idx} value={tagName} />
          ))}
        </datalist>

        {headerTags.size === 0 ? (
          <div className="no-tags-message">
            This header doesn't have any tags.
            <br />
            <br />
            Click the <i className="fas fa-plus" /> button to add a new one, or choose from the list
            of all of your tags below.
          </div>
        ) : (
          <Droppable droppableId="tags-editor-droppable" type="TAG">
            {(provided, _snapshot) => (
              <div className="tags-container" ref={provided.innerRef} {...provided.droppableProps}>
                <Fragment>
                  {headerTags.map((tag, index) => (
                    <Draggable draggableId={`tag--${index}`} index={index} key={index}>
                      {(provided, snapshot) => (
                        <div
                          className={classNames('tag-container', {
                            'tag-container--dragging': snapshot.isDragging,
                          })}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <input
                            type="text"
                            className="textfield tag-container__textfield"
                            value={tag}
                            onChange={this.handleTagChange(index)}
                            ref={(textfield) => (this.lastTextfield = textfield)}
                            list="drawer-modal__datalist-tag-names"
                          />
                          <div className="tag-container__actions-container">
                            <i
                              className="fas fa-times fa-lg"
                              onClick={this.handleRemoveTag(index)}
                            />
                            <i
                              className="fas fa-bars fa-lg tag-container__drag-handle drag-handle"
                              {...provided.dragHandleProps}
                            />
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
        )}

        <div className="tags-editor__add-new-container">
          <button className="fas fa-plus fa-lg btn btn--circle" onClick={this.handleAddNewTag} />
        </div>

        <hr className="tags-editor__separator" />

        <h2 className="tags-editor__title">All tags</h2>

        <div className="all-tags-container">
          {allTags
            .filter((tag) => !!tag)
            .map((tag) => {
              const className = classNames('all-tags__tag', {
                'all-tags__tag--in-use': headerTags.includes(tag),
              });

              return (
                <div className={className} key={tag} onClick={this.handleExistingTagClick(tag)}>
                  {tag}
                </div>
              );
            })}
        </div>
      </>
    );
  }
}
