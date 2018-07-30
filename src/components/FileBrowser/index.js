import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './FileBrowser.css';

import _ from 'lodash';

import classNames from 'classnames';

import * as dropboxActions from '../../actions/dropbox';

class FileBrowser extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleParentDirectoryClick']);
  }

  componentDidMount() {
    this.props.dropbox.getDirectoryListing('');
  }

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

  handleParentDirectoryClick() {
    const pathParts = this.props.currentFileBrowserDirectoryPath.split('/');
    const parentPath = pathParts.slice(0, pathParts.length - 1).join('/');
    this.props.dropbox.getDirectoryListing(parentPath);
  }

  render() {
    const {
      currentFileBrowserDirectoryPath,
      currentFileBrowserDirectoryListing,
    } = this.props;

    const isTopLevelDirectory = currentFileBrowserDirectoryPath === '';

    return (
      <div>
        <h3 className="file-browser__header">
          Directory: {isTopLevelDirectory ? '/' : currentFileBrowserDirectoryPath}
        </h3>

        <ul className="file-browser__file-list">
          {!isTopLevelDirectory && (
            <li className="file-browser__file-list__element" onClick={this.handleParentDirectoryClick}>
              <i className="fas fa-folder file-browser__file-list__icon--directory" /> ..
            </li>
          )}

          {(currentFileBrowserDirectoryListing || []).map(file => {
            const iconClass = classNames('fas', {
              'fa-folder': file.get('isDirectory'),
              'file-browser__file-list__icon--directory': file.get('isDirectory'),
              'fa-file': !file.get('isDirectory') && !file.get('name').endsWith('.org-web-bak'),
              'file-browser__file-list__icon--not-org': !file.get('name').endsWith('.org'),
              'fa-copy': file.get('name').endsWith('.org-web-bak'),
            });

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
    currentFileBrowserDirectoryPath: state.dropbox.get('currentFileBrowserDirectoryPath'),
    currentFileBrowserDirectoryListing: state.dropbox.get('currentFileBrowserDirectoryListing'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FileBrowser);
