import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import SlideUp from '../../../UI/SlideUp';

import { Droppable, Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

export default class PropertyListEditorModal extends PureComponent {
  render() {
    const { onClose, propertyListItems } = this.props;
    console.log('propertyListItems = ', propertyListItems.toJS());

    return (
      <SlideUp shouldIncludeCloseButton onClose={onClose}>
        <h2 className="slide-up-modal__title">Edit property list</h2>

        {propertyListItems.size === 0 ? (
          <div className="no-items-message">
            There are no items in this property list.
            <br />
            <br />
            Click the <i className="fas fa-plus" /> button to add a new one.
          </div>
        ) : (
          <Droppable droppableId="property-list-editor-droppable" type="PROPERTY-LIST">
            {(provided, snapshot) => (
              <div
                className="property-list-editor__items-container"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <Fragment>
                  {propertyListItems.map((propertyListItem, index) => (
                    <Draggable
                      draggableId={`property-list-item--${index}`}
                      index={index}
                      key={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          className={classNames('property-list-editor__item-container', {
                            'property-list-editor__item-container--dragging': snapshot.isDragging,
                          })}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div className="item__textfields-container">
                            <input
                              type="text"
                              className="textfield item-container__textfield"
                              value={propertyListItem.get('property')}
                              onChange={() => {} /* TODO this.handleTagChange(index) */}
                              ref={textfield => (this.lastTextfield = textfield)}
                            />
                            <input
                              type="text"
                              className="textfield item-container__textfield"
                              value={propertyListItem.get('value') || ''}
                              onChange={() => {} /* TODO this.handleTagChange(index) */}
                            />
                          </div>
                          <div className="item-container__actions-container">
                            <i
                              className="fas fa-times fa-lg"
                              onClick={() => {} /* TODO: this.handleRemoveTag(index) */}
                            />
                            <i
                              className="fas fa-bars fa-lg item-container__drag-handle"
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

        <div className="property-list-editor__add-new-container">
          <button
            className="fas fa-plus fa-lg btn btn--circle"
            onClick={() => {} /* TODO: this.handleAddNewTag */}
          />
        </div>
      </SlideUp>
    );
  }
}
