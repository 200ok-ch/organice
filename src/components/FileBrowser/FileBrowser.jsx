import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './FileBrowser.css';

import classNames from 'classnames';

import * as dropboxActions from '../../actions/dropbox';

class FileBrowser extends Component {
  componentDidMount() {
    this.props.dropbox.getDirectoryListing('');
  }

  render() {
    const {
      currentFileBrowserDirectoryPath,
      currentFileBrowserDirectoryListing,
    } = this.props;

    return (
      <div>
        <h3 className="file-browser__header">
          Directory: {currentFileBrowserDirectoryPath === '' ? '/' : currentFileBrowserDirectoryPath}
        </h3>

        <ul className="file-browser__file-list">
          {(currentFileBrowserDirectoryListing || []).map(file => {
            const iconClass = classNames('fas', {
              'fa-folder': file.get('isDirectory'),
              'file-browser__file-list__icon--directory': file.get('isDirectory'),
              'fa-file': !file.get('isDirectory'),
              'file-browser__file-list__icon--not-org': !file.get('name').endsWith('.org'),
            });

            return (
              <li className="file-browser__file-list__element" key={file.get('id')}>
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
