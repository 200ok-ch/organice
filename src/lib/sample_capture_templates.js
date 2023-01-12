import generateId from './id_generator';

import { fromJS } from 'immutable';

export default fromJS([
  {
    description: 'Groceries',
    headerPaths: ['Capture', 'Groceries'],
    iconName: 'lemon',
    id: generateId(),
    isAvailableInAllOrgFiles: false,
    letter: '',
    orgFilesWhereAvailable: [],
    shouldPrepend: false,
    shouldCaptureAsNewHeader: true,
    template: '* TODO %?',
    isSample: true,
  },
  {
    description: 'Deeply nested header',
    headerPaths: ['Capture', 'Deeply', 'Nested', 'Headers', 'Work', 'Too!'],
    iconName: 'fighter-jet',
    id: generateId(),
    isAvailableInAllOrgFiles: false,
    letter: '',
    orgFilesWhereAvailable: [],
    shouldPrepend: true,
    shouldCaptureAsNewHeader: true,
    template: '* You can insert timestamps too! %T %?',
    isSample: true,
  },
]);
