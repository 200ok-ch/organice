import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link } from 'react-router-dom';

import ShortcutRow from './components/ShortcutRow';

import * as baseActions from '../../actions/base';

import './KeyboardShortcutsEditor.css';

import _ from 'lodash';

class KeyboardShortcutsEditor extends PureComponent {
  constructor(props) {
    super(props);

    // TODO: remove this if I don't use it
    _.bindAll(this, []);
  }

  render() {
    return (
      <div className="keyboard-shortcuts-editor-container">
        <ShortcutRow name="Select next header" binding="ctrl+n" />
        <ShortcutRow name="Select previous header" binding="ctrl+p" />
        <ShortcutRow name="Move header right" binding="command+shift+f" />
        <ShortcutRow name="Move header right" binding="alt+meta+return" />

        <div className="keyboard-shortcuts-editor__btn-container">
          <Link to="/settings" className="btn settings-btn">Done</Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(KeyboardShortcutsEditor);
