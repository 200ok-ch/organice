import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './OrgFile.css';

import _ from 'lodash';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';

import * as orgActions from '../../actions/org';

class OrgFile extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleBackToFileBrowserClick']);
  }

  handleBackToFileBrowserClick() {
    this.props.org.stopDisplayingFile();
  }

  render() {
    const { headers } = this.props;

    return (
      <div>
        {headers.size === 0 ? (
          <div className="org-file__parsing-error-message">
            <h3>Couldn't parse file</h3>
            If you think this is a bug, please
            {' '}<a href="https://github.com/DanielDe/org-web/issues/new" target="_blank" rel="noopener noreferrer">create an issue</a>
            {' '}and include the org file if possible!
          </div>
        ) : (
          <HeaderList />
        )}

        <div className="btn org-file__btn" onClick={this.handleBackToFileBrowserClick}>
          Back to file browser
        </div>

        <ActionDrawer />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    headers: state.org.get('headers'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
