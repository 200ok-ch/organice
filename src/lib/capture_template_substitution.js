import { Map } from 'immutable';
import format from 'date-fns/format';
import _ from 'lodash';

export default (templateString, customVariables = Map()) => {
  if (!templateString) {
    return ['', null];
  }

  const substitutions = {
    '%t': `<${format(new Date(), 'yyyy-MM-dd eee')}>`,
    '%T': `<${format(new Date(), 'yyyy-MM-dd eee HH:mm')}>`,
    '%u': `[${format(new Date(), 'yyyy-MM-dd eee')}]`,
    '%U': `[${format(new Date(), 'yyyy-MM-dd eee HH:mm')}]`,
    '%r': `${format(new Date(), 'yyyy-MM-dd eee')}`,
    '%R': `${format(new Date(), 'yyyy-MM-dd eee HH:mm')}`,
    '%y': `${format(new Date(), 'yyyy')}`,
  };

  customVariables.entrySeq().forEach(([key, value]) => {
    substitutions[`%${key}`] = value;
  });

  let substitutedString = templateString;
  _.entries(substitutions).forEach(
    ([formatString, value]) =>
      (substitutedString = substitutedString.replace(RegExp(formatString, 'g'), value))
  );

  const cursorIndex = substitutedString.includes('%?') ? substitutedString.indexOf('%?') : null;
  substitutedString = substitutedString.replace(/%\?/, '');

  return [substitutedString, cursorIndex];
};
