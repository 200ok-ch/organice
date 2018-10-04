import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link } from 'react-router-dom';

import './stylesheet.css';

import _ from 'lodash';
import classNames from 'classnames';

import * as syncBackendActions from '../../actions/sync_backend';

class FileBrowser extends PureComponent {
  componentDidMount() {
    this.props.syncBackend.getDirectoryListing(this.props.path);

    _.bindAll(this, ['handleLoadMoreClick']);
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props;

    if (prevProps.path !== path) {
      this.props.syncBackend.getDirectoryListing(path);
    }
  }

  handleLoadMoreClick() {
    this.props.syncBackend.loadMoreDirectoryListing();
  }

  getParentDirectoryPath() {
    const { syncBackendType, additionalSyncBackendState } = this.props;

    switch (syncBackendType) {
      case 'Dropbox':
        const pathParts = this.props.path.split('/');
        return pathParts.slice(0, pathParts.length - 1).join('/');
      case 'Google Drive':
        return !!additionalSyncBackendState.get('parentId')
          ? '/' + additionalSyncBackendState.get('parentId')
          : null;
      default:
        return null;
    }
  }

  render() {
    const { path, listing, hasMore, isLoadingMore, syncBackendType } = this.props;

    const isTopLevelDirectory = path === '';

    return (
      <div className="file-browser-container">
        {syncBackendType === 'Dropbox' && (
          <h3 className="file-browser__header">Directory: {isTopLevelDirectory ? '/' : path}</h3>
        )}

        <ul className="file-browser__file-list">
          {!isTopLevelDirectory && (
            <Link to={`/files${this.getParentDirectoryPath()}`}>
              <li className="file-browser__file-list__element">
                <i className="fas fa-folder file-browser__file-list__icon--directory" /> ..
              </li>
            </Link>
          )}

          {(listing || []).map(file => {
            const isDirectory = file.get('isDirectory');
            const isBackupFile = file.get('name').endsWith('.org-web-bak');
            const isOrgFile = file.get('name').endsWith('.org');
            const isSettingsFile = file.get('name') === '.org-web-config.json';

            const iconClass = classNames('file-browser__file-list__icon fas', {
              'fa-folder': isDirectory,
              'file-browser__file-list__icon--directory': isDirectory,
              'fa-file': !isDirectory && !isBackupFile && !isSettingsFile,
              'file-browser__file-list__icon--not-org': !isOrgFile,
              'fa-copy': isBackupFile,
              'fa-cogs': isSettingsFile,
            });

            if (file.get('isDirectory')) {
              return (
                <Link to={`/files${file.get('path')}`} key={file.get('id')}>
                  <li className="file-browser__file-list__element">
                    <i className={iconClass} /> {file.get('name')}/
                  </li>
                </Link>
              );
            } else {
              return (
                <Link to={`/file${file.get('path')}`} key={file.get('id')}>
                  <li className="file-browser__file-list__element">
                    <i className={iconClass} /> {file.get('name')}
                  </li>
                </Link>
              );
            }
          })}

          {hasMore &&
            (isLoadingMore ? (
              <li className="file-browser__file-list__loading-more-container">
                <i className="fas fa-spinner fa-lg fa-spin" />
              </li>
            ) : (
              <li
                className="file-browser__file-list__element file-browser__file-list__element--load-more-row"
                onClick={this.handleLoadMoreClick}
              >
                Load more...
              </li>
            ))}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const currentFileBrowserDirectoryListing = state.syncBackend.get(
    'currentFileBrowserDirectoryListing'
  );
  return {
    syncBackendType: state.syncBackend.get('client').type,
    listing: !!currentFileBrowserDirectoryListing
      ? currentFileBrowserDirectoryListing.get('listing')
      : null,
    hasMore:
      !!currentFileBrowserDirectoryListing && currentFileBrowserDirectoryListing.get('hasMore'),
    isLoadingMore:
      !!currentFileBrowserDirectoryListing &&
      currentFileBrowserDirectoryListing.get('isLoadingMore'),
    additionalSyncBackendState:
      !!currentFileBrowserDirectoryListing &&
      currentFileBrowserDirectoryListing.get('additionalSyncBackendState'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FileBrowser);
