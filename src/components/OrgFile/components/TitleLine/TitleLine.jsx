import React, { PureComponent } from 'react';

import './TitleLine.css';

import classNames from 'classnames';

import AttributedString from '../AttributedString/AttributedString';

export default class TitleLine extends PureComponent {
  render() {
    const { header, color, hasContent } = this.props;
    const todoKeyword = header.get('todoKeyword');

    const titleStyle = {
      color,
      fontWeight: 'bold',
    };

    return (
      <div className="title-line">
        {!!todoKeyword ? (
          <span className={classNames('todo-keyword', `todo-keyword--${todoKeyword.toLowerCase()}`)}>
            {todoKeyword}
          </span>
        ) : ''}

        <div>
          <span style={titleStyle}>
            <AttributedString parts={header.getIn(['titleLine', 'title'])} />
            {!header.get('opened') || hasContent ? '...' : ''}
          </span>

          {header.getIn(['titleLine', 'tags']).size > 0 && (
            <div>
              {header.getIn(['titleLine', 'tags']).toSet().toList().map(tag => (
                <div className="header-tag" key={tag}>{tag}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
