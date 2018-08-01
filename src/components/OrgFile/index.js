import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './OrgFile.css';

import HeaderList from './components/HeaderList';
import ActionDrawer from './components/ActionDrawer';

import * as baseActions from '../../actions/base';

class OrgFile extends PureComponent {
  componentDidMount() {
    const { staticFile } = this.props;

    if (!!staticFile) {
      this.props.base.loadStaticFile(staticFile);
    }
  }

  componentWillUnmount() {
    const { staticFile } = this.props;

    if (!!staticFile) {
      this.props.base.unloadStaticFile();
    }
  }

  render() {
    const {
      headers,
      backButtonText,
      onBackClick,
      shouldDisableDirtyIndicator,
      shouldDisableSyncButtons,
      shouldDisableActionDrawer,
      isDirty,
      parsingErrorMessage,
    } = this.props;

    if (!headers) {
      return <div></div>;
    }

    return (
      <div>
        {headers.size === 0 ? (
          <div className="org-file__parsing-error-message">
            <h3>Couldn't parse file</h3>

            {!!parsingErrorMessage ? (
              <Fragment>{parsingErrorMessage}</Fragment>
            ) : (
              <Fragment>
                If you think this is a bug, please
                {' '}<a href="https://github.com/DanielDe/org-web/issues/new" target="_blank" rel="noopener noreferrer">create an issue</a>
                {' '}and include the org file if possible!
              </Fragment>
            )}
          </div>
        ) : (
          <HeaderList />
        )}

        <div className="btn org-file__btn" onClick={onBackClick}>
          {backButtonText}
        </div>

        {isDirty && !shouldDisableDirtyIndicator && <div className="dirty-indicator">Unpushed changes</div>}

        {!shouldDisableActionDrawer && <ActionDrawer shouldDisableSyncButtons={shouldDisableSyncButtons} />}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    headers: state.org.present.get('headers'),
    isDirty: state.org.present.get('isDirty'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgFile);
