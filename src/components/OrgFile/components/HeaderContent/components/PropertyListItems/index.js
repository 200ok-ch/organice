import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import AttributedString from '../../../AttributedString';

import _ from 'lodash';

export default class PropertyListItems extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCollapseToggle']);

    this.state = {
      isDrawerCollapsed: true,
    };
  }

  handleCollapseToggle() {
    this.setState({ isDrawerCollapsed: !this.state.isDrawerCollapsed });
  }

  render() {
    const { propertyListItems, shouldDisableActions, onTimestampClick, onEdit } = this.props;
    const { isDrawerCollapsed } = this.state;

    if (propertyListItems.size === 0) {
      return null;
    }

    return (
      <div className="property-list-container">
        <div className="property-list__property" onClick={this.handleCollapseToggle}>
          :PROPERTIES:
          {isDrawerCollapsed ? '...' : ''}
        </div>

        {!isDrawerCollapsed && (
          <Fragment>
            {propertyListItems.map(propertyListItem => (
              <div className="property-list__item-container" key={propertyListItem.get('id')}>
                <div className="property-list__property" onClick={onEdit}>
                  :{propertyListItem.get('property')}:
                </div>
                <div className="property-list__value">
                  <AttributedString
                    parts={propertyListItem.get('value') || []}
                    subPartDataAndHandlers={{
                      onTimestampClick,
                      shouldDisableActions,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="property-list__property" onClick={onEdit}>
              :END:
            </div>
          </Fragment>
        )}
      </div>
    );
  }
}
