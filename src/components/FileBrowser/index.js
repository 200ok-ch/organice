import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link } from 'react-router-dom';

import './FileBrowser.css';

import classNames from 'classnames';

import * as syncBackendActions from '../../actions/syncBackend';

class FileBrowser extends PureComponent {
  componentDidMount() {
    this.props.syncBackend.getDirectoryListing(this.props.path);
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props;

    if (prevProps.path !== path) {
      this.props.syncBackend.getDirectoryListing(path);
    }
  }

  getParentDirectoryPath() {
    const pathParts = this.props.path.split('/');
    return pathParts.slice(0, pathParts.length - 1).join('/');
  }

  render() {
    const {
      path,
      currentFileBrowserDirectoryListing,
    } = this.props;

    const isTopLevelDirectory = path === '';

    return (
      <div className="file-browser-container">
        <h3 className="file-browser__header">
          Directory: {isTopLevelDirectory ? '/' : path}
        </h3>

        <ul className="file-browser__file-list">
          {!isTopLevelDirectory && (
            <Link to={`/files${this.getParentDirectoryPath()}`}>
              <li className="file-browser__file-list__element">
                <i className="fas fa-folder file-browser__file-list__icon--directory" /> ..
              </li>
            </Link>
          )}

          {(currentFileBrowserDirectoryListing || []).map(file => {
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
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    currentFileBrowserDirectoryListing: state.syncBackend.get('currentFileBrowserDirectoryListing'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);
