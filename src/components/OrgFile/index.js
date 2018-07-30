import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import './OrgFile.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';

class OrgFile extends PureComponent {
  render() {
    const {
      headers,
      backButtonText,
      onBackClick,
      shouldDisableSyncButtons,
      shouldDisableActionDrawer,
    } = this.props;

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

        <div className="btn org-file__btn" onClick={onBackClick}>
          {backButtonText}
        </div>

        {!shouldDisableActionDrawer && <ActionDrawer shouldDisableSyncButtons={shouldDisableSyncButtons} />}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    headers: state.org.present.get('headers'),
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
