import { Map } from 'immutable';
import moment from 'moment';
import _ from 'lodash';

export default (templateString, customVariables = Map()) => {
  if (!templateString) {
    return ['', null];
  }

  const substitutions = {
    '%t' : `<${moment().format('YYYY-MM-DD ddd')}>`,
    '%T' : `<${moment().format('YYYY-MM-DD ddd HH:mm')}>`,
    '%u' : `[${moment().format('YYYY-MM-DD ddd')}]`,
    '%U' : `[${moment().format('YYYY-MM-DD ddd HH:mm')}]`,
  };

  customVariables.entrySeq().forEach(([key, value]) => {
    substitutions[`%${key}`] = value;
  });

  let substitutedString = templateString;
  _.entries(substitutions).forEach(([formatString, value]) => (
    substitutedString = substitutedString.replace(RegExp(formatString, 'g'), value)
  ));

  const cursorIndex = substitutedString.includes('%?') ? substitutedString.indexOf('%?') : null;
  substitutedString = substitutedString.replace(/%\?/, '');

  return [substitutedString, cursorIndex];
};
