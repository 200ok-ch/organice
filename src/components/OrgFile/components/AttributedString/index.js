import React from 'react';

import { Link, useLocation } from 'react-router-dom';

import './stylesheet.css';

import TablePart from './components/TablePart';
import ListPart from './components/ListPart';
import TimestampPart from './components/TimestampPart';

import { orgFileExtensions } from '../../../../lib/org_utils';

import classNames from 'classnames';

export default ({ parts, subPartDataAndHandlers }) => {
  let className;

  let location = useLocation();

  const renderLink = (part) => {
    const id = part.get('id');
    const uri = part.getIn(['contents', 'uri']);
    const title = part.getIn(['contents', 'title']) || uri;
    let target = uri;
    if (uri.startsWith('file:')) {
      target = uri.substr(5);
      const isRelativeOrgFileLink =
        !target.startsWith('/') &&
        !target.startsWith('~') &&
        uri.match(orgFileExtensions);
      if (isRelativeOrgFileLink) {
        target = normalisePath(target);
        if (!target.includes('/../')) {
          // Normalisation succeeded, so we can safely return a <Link>
          return (
              <Link key={id} to={target}>{title}</Link>
          );
        }
      }

      // Best effort in other cases; the file:// href may or may not work,
      // but either way it should help show the user what's going on.
      target = 'file://' + target;
    }

    return (
        <a key={id} href={target} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
    );
  };

  const normalisePath = target => {
    let dir = location.pathname.match(/(.*)\//)[1];
    let normalised = target;
    while (normalised.startsWith("../")) {
      if (!dir.match(/^\/file\/.+/)) {
        // We're already at the top; can't break out of the area accessible
        // via HTTP, so just the original non-normalised path
        return target;
      }
      normalised = normalised.substr(3);
      dir = dir.match(/(.*)\//)[1];
    }
    return dir + '/' + normalised;
  }

  return (
    <span>
      {parts.map((part) => {
        switch (part.get('type')) {
          case 'text':
            return part.get('contents');
          case 'link':
            return renderLink(part);
          case 'percentage-cookie':
            className = classNames('attributed-string__cookie-part', {
              'attributed-string__cookie-part--complete':
                parseInt(part.get('percentage'), 10) === 100,
            });

            return (
              <span key={part.get('id')} className={className}>
                [{part.get('percentage')}
                %]
              </span>
            );
          case 'fraction-cookie':
            className = classNames('attributed-string__cookie-part', {
              'attributed-string__cookie-part--complete':
                part.getIn(['fraction', 0]) !== '' &&
                part.getIn(['fraction', 0]) === part.getIn(['fraction', 1]),
            });

            return (
              <span key={part.get('id')} className={className}>
                [{part.getIn(['fraction', 0])}/{part.getIn(['fraction', 1])}]
              </span>
            );
          case 'table':
            return (
              <TablePart
                key={part.get('id')}
                table={part}
                subPartDataAndHandlers={subPartDataAndHandlers}
              />
            );
          case 'list':
            return (
              <ListPart
                key={part.get('id')}
                part={part}
                subPartDataAndHandlers={subPartDataAndHandlers}
              />
            );
          case 'inline-markup':
            className = classNames(
              'attributed-string__inline-markup',
              `attributed-string__inline-markup--${part.get('markupType')}`
            );

            return (
              <span key={part.get('id')} className={className}>
                {part.get('content')}
              </span>
            );
          case 'timestamp':
            return (
              <TimestampPart
                key={part.get('id')}
                part={part}
                subPartDataAndHandlers={subPartDataAndHandlers}
              />
            );
          case 'url':
            return (
              <a
                href={part.get('content')}
                key={part.get('id')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.get('content')}
              </a>
            );
          case 'www-url':
            return (
              <a
                href={`https://${part.get('content')}`}
                key={part.get('id')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.get('content')}
              </a>
            );
          case 'e-mail':
            return (
              <a href={`mailto:${part.get('content')}`} key={part.get('id')}>
                {part.get('content')}
              </a>
            );
          case 'phone-number':
            return (
              <a href={`tel:${part.get('content')}`} key={part.get('id')}>
                {part.get('content')}
              </a>
            );
          default:
            console.error(`Unrecognized attributed string part type! ${part.get('type')}`);
            return '';
        }
      })}
    </span>
  );
};
