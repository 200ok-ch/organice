import React, { PureComponent, Fragment } from 'react';

import { Droppable, Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import _ from 'lodash';
import classNames from 'classnames';

export default class NotificationsEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRemoveNotification',
      'handleAddNewNotification',
      'handleNotificationChange',
    ]);

    this.state = {
      allNotifications: props.allNotifications,
    };
  }

  componentDidUpdate(prevProps) {
    const prevNotifications = prevProps.header.getIn(['titleLine', 'notifications']);
    const currentNotifications = this.props.header.getIn(['titleLine', 'notifications']);
    if (
      prevNotifications.size === currentNotifications.size - 1 &&
      currentNotifications.last() === ''
    ) {
      if (this.lastTextfield) {
        this.lastTextfield.focus();
      }
    }
  }

  handleNotificationChange(notificationIndex) {
    return (event) => {
      const notifications = this.props.header.getIn(['titleLine', 'notifications']);
      this.props.onChange(
        notifications.set(notificationIndex, event.target.value.replace(/(\s+|:)/g, ''))
      );
    };
  }

  handleRemoveNotification(notificationIndex) {
    return () => {
      const notifications = this.props.header.getIn(['titleLine', 'notifications']);
      this.props.onChange(notifications.delete(notificationIndex));
    };
  }

  handleAddNewNotification() {
    const notifications = this.props.header.getIn(['titleLine', 'notifications']);
    this.props.onChange(notifications.push(''));
  }

  handleExistingNotificationClick(newNotification) {
    return () => {
      const notifications = this.props.header.getIn(['titleLine', 'notifications']);
      if (notifications.includes(newNotification)) {
        this.props.onChange(
          notifications.filter((notification) => notification !== newNotification)
        );
      } else {
        this.props.onChange(notifications.push(newNotification));
      }
    };
  }

  render() {
    const { header } = this.props;
    const { allNotifications } = this.state;

    const headerNotifications = header.getIn(['titleLine', 'notifications']);

    return (
      <>
        <h2 className="drawer-modal__title">Edit notifications</h2>

        <datalist id="drawer-modal__datalist-notification-names">
          {allNotifications.map((notificationName, idx) => (
            <option key={idx} value={notificationName} />
          ))}
        </datalist>

        {headerNotifications.size === 0 ? (
          <div className="no-notifications-message">
            This header doesn't have any notifications.
            <br />
            <br />
            Click the <i className="fas fa-plus" /> button to add a new one, or choose from the list
            of all of your notifications below.
          </div>
        ) : (
          <Droppable droppableId="notifications-editor-droppable" type="NOTIFICATION">
            {(provided, _snapshot) => (
              <div
                className="notifications-container"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <Fragment>
                  {headerNotifications.map((notification, index) => (
                    <Draggable draggableId={`notification--${index}`} index={index} key={index}>
                      {(provided, snapshot) => (
                        <div
                          className={classNames('notification-container', {
                            'notification-container--dragging': snapshot.isDragging,
                          })}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <input
                            type="text"
                            className="textfield notification-container__textfield"
                            value={notification}
                            onChange={this.handleNotificationChange(index)}
                            ref={(textfield) => (this.lastTextfield = textfield)}
                            list="drawer-modal__datalist-notification-names"
                          />
                          <div className="notification-container__actions-container">
                            <i
                              className="fas fa-times fa-lg"
                              onClick={this.handleRemoveNotification(index)}
                            />
                            <i
                              className="fas fa-bars fa-lg notification-container__drag-handle drag-handle"
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

        <div className="notifications-editor__add-new-container">
          <button
            className="fas fa-plus fa-lg btn btn--circle"
            onClick={this.handleAddNewNotification}
          />
        </div>

        <hr className="notifications-editor__separator" />

        <h2 className="notifications-editor__title">All notifications</h2>

        <div className="all-notifications-container">
          {allNotifications
            .filter((notification) => !!notification)
            .map((notification) => {
              const className = classNames('all-notifications__notification', {
                'all-notifications__notification--in-use': headerNotifications.includes(
                  notification
                ),
              });

              return (
                <div
                  className={className}
                  key={notification}
                  onClick={this.handleExistingNotificationClick(notification)}
                >
                  {notification}
                </div>
              );
            })}
        </div>
      </>
    );
  }
}
