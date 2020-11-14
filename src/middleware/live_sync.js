import { sync } from '../actions/org';

export default (store) => (next) => (action) => {
  if (action.dirtying && store.getState().base.get('shouldLiveSync')) {
    if (action.type === 'REFILE_SUBTREE') {
      store.dispatch(sync({ shouldSuppressMessages: true, path: action.sourcePath }));
      store.dispatch(sync({ shouldSuppressMessages: true, path: action.targetPath }));
    } else {
      store.dispatch(
        sync({ shouldSuppressMessages: true, path: store.getState().org.present.get('path') })
      );
    }
  }

  return next(action);
};
