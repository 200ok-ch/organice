import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { withRouter } from 'react-router-dom';

import { Map } from 'immutable';

import ShortcutRow from './components/ShortcutRow';

import * as baseActions from '../../actions/base';

import { calculateNamedKeybindings } from '../../lib/keybindings';

import './KeyboardShortcutsEditor.css';

import _ from 'lodash';

class KeyboardShortcutsEditor extends PureComponent {
  DEFAULT_BINDINGS = [
    ['Select next header', 'ctrl+n'],
    ['Select previous header', 'ctrl+p'],
    ['Toggle header opened', 'tab'],
    ['Advance todo state', 'ctrl+t'],
    ['Edit title', 'ctrl+h'],
    ['Edit description', 'ctrl+d'],
    ['Exit edit mode', 'command+enter'],
    ['Add header', 'ctrl+enter'],
    ['Remove header', 'backspace'],
    ['Move header up', 'ctrl+command+p'],
    ['Move header down', 'ctrl+command+n'],
    ['Move header left', 'ctrl+command+b'],
    ['Move header right', 'ctrl+command+f'],
    ['Undo', 'ctrl+shift+-'],
  ];

  constructor(props) {
    super(props);

    _.bindAll(this, ['handleBindingChange']);
  }

  handleBindingChange(bindingName, newBinding) {
    const { customKeybindings } = this.props;

    const alreadyInUseBinding = calculateNamedKeybindings(customKeybindings).filter(([_, binding]) => (
      binding === newBinding
    ))[0];

    if (!!alreadyInUseBinding) {
      alert(`That binding is already in use for "${alreadyInUseBinding[0]}"`);
      return;
    }

    this.props.base.setCustomKeybinding(bindingName, newBinding);
  }

  render() {
    const { customKeybindings } = this.props;

    return (
      <div className="keyboard-shortcuts-editor-container">
        {calculateNamedKeybindings(customKeybindings).map(([name, binding]) => (
          <ShortcutRow key={name}
                       name={name}
                       binding={binding}
                       onBindingChange={this.handleBindingChange} />
        ))}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    customKeybindings: state.base.get('customKeybindings') || Map()
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(KeyboardShortcutsEditor));
