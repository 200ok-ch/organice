import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link, useLocation } from 'react-router-dom';

import './stylesheet.css';

import TablePart from './components/TablePart';
import ListPart from './components/ListPart';
import TimestampPart from './components/TimestampPart';
import ExternalLink from '../../../UI/ExternalLink';

import { orgFileExtensions } from '../../../../lib/org_utils';
import * as orgActions from '../../../../actions/org';

import classNames from 'classnames';

const AttributedString = ({ org, parts, subPartDataAndHandlers }) => {
  let className;

  let location = useLocation();

  const renderLink = (part) => {
    const id = part.get('id');
    const uri = part.getIn(['contents', 'uri']);
    const title = part.getIn(['contents', 'title']) || uri;
    let target = uri;
    if (uri.startsWith('file:')) {
      target = uri.substr(5);
      const isRelativeFileLink = !target.startsWith('/') && !target.startsWith('~');
      if (isRelativeFileLink) {
        // N.B. Later on we may improve this conditional by performing
        // an existence check on the backend if it allows that
        // operation.

        target = normalisePath(target);
        if (!target.includes('/../')) {
          // Normalisation succeeded, so we can safely return a <Link>
          if (!uri.match(orgFileExtensions)) {
            // Optimistically assume that the link is pointing to a
            // directory.
            target = target.replace(/^\/file\//, '/files/');
            return (
              <Link key={id} to={target}>
                {title}
              </Link>
            );
          }
        }
      }
      target = target.replace(/^\/file\//, '/');
      return (
        <span
          key={id}
          style={{ textDecoration: 'underline' }}
          data-target={target}
          onClick={() => org.setPath(target)}
        >
          {title}
        </span>
      );
    }

    return (
      <ExternalLink key={id} href={target}>
        {title}
      </ExternalLink>
    );
  };

  const normalisePath = (target) => {
    let dir = location.pathname.match(/(.*)\//)[1];
    let normalised = target;
    while (normalised.startsWith('../')) {
      if (!dir.match(/^\/file\/.+/)) {
        // We're already at the top; can't break out of the area accessible
        // via HTTP, so just the original non-normalised path
        return target;
      }
      normalised = normalised.substr(3);
      dir = dir.match(/(.*)\//)[1];
    }
    return dir + '/' + normalised;
  };

  return (
    <span>
      {parts.map((part, index) => {
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
                descriptionItemIndex={index}
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
              <ExternalLink href={part.get('content')} key={part.get('id')}>
                {part.get('content')}
              </ExternalLink>
            );
          case 'www-url':
            return (
              <ExternalLink href={`https://${part.get('content')}`} key={part.get('id')}>
                {part.get('content')}
              </ExternalLink>
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

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(null, mapDispatchToProps)(AttributedString);
