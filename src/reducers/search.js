// import { Map, List, fromJS } from 'immutable';
import _ from 'lodash';

import headline_filter_parser from '../lib/headline_filter_parser';

export const setSearchFilter = (state, action) => {
  const { searchFilter } = action;
  try {
    const filterExpr = headline_filter_parser.parse(searchFilter);
    state = state.set('searchFilterExpr', filterExpr);
  } catch (e) {
    console.warn('Exception parsing headline filter: ' + e);
  }
  state = state.set('searchFilter', _.trim(searchFilter));

  return state;
};

export default (state = new Map(), action) => {
  if (action.dirtying) {
    state = state.set('isDirty', true);
  }

  switch (action.type) {
    case 'SET_SEARCH_FILTER':
      return setSearchFilter(state, action);

    default:
      return state;
  }
};
