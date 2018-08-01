import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link } from 'react-router-dom';

import './FileBrowser.css';

import classNames from 'classnames';

import * as dropboxActions from '../../actions/dropbox';

class FileBrowser extends PureComponent {
  componentDidMount() {
    this.props.dropbox.getDirectoryListing(this.props.path);
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props;

    if (prevProps.path !== path) {
      this.props.dropbox.getDirectoryListing(path);
    }
  }

  // TODO: probably kill this.
  handleFileListElementClick(fileId) {
    return () => {
      const { currentFileBrowserDirectoryListing } = this.props;

      const selectedFile = currentFileBrowserDirectoryListing.find(file => file.get('id') === fileId);

      if (selectedFile.get('isDirectory')) {
        this.props.dropbox.getDirectoryListing(selectedFile.get('path'));
      } else {
        this.props.dropbox.downloadFile(selectedFile.get('path'));
      }
    };
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
            const iconClass = classNames('file-browser__file-list__icon fas', {
              'fa-folder': file.get('isDirectory'),
              'file-browser__file-list__icon--directory': file.get('isDirectory'),
              'fa-file': !file.get('isDirectory') && !file.get('name').endsWith('.org-web-bak'),
              'file-browser__file-list__icon--not-org': !file.get('name').endsWith('.org'),
              'fa-copy': file.get('name').endsWith('.org-web-bak'),
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
              // TODO: link to files
            }

            return (
              <li className="file-browser__file-list__element"
                  key={file.get('id')}
                  onClick={this.handleFileListElementClick(file.get('id'))}>
                <i className={iconClass} /> {file.get('name')}{file.get('isDirectory') ? '/' : ''}
              </li>
            );
            })}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    currentFileBrowserDirectoryListing: state.dropbox.get('currentFileBrowserDirectoryListing'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);
