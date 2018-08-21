import React, { PureComponent } from 'react';

import generateId from '../../../../lib/id_generator';

import TablePart from './components/TablePart';
import ListPart from './components/ListPart';

export default class AttributedString extends PureComponent {
  render() {
    const {
      parts,
      subPartDataAndHandlers,
    } = this.props;

    return (
      <span>
        {parts.map(part => {
          switch (part.get('type')) {
          case 'text':
            return part.get('contents');
          case 'link':
            const uri = part.getIn(['contents', 'uri']);
            const title = part.getIn(['contents', 'title']) || uri;

            return <a key={generateId()} href={uri}>{title}</a>;
          case 'table':
            return (
              <TablePart key={part.get('id')}
                         table={part}
                         subPartDataAndHandlers={subPartDataAndHandlers} />
            );
          case 'list':
            return (
              <ListPart key={part.get('id')}
                        part={part}
                        subPartDataAndHandlers={subPartDataAndHandlers} />
            );
          default:
            console.error(`Unrecognized attributed string part type ${part.get('type')}`);
            return '';
          }
        })}
      </span>
    );
  }
}
