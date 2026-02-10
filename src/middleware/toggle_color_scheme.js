// The outer (store) => function is called once during applyMiddleware.
// Register the OS color scheme change listener here, not in the action handler.
export default (store) => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const prefersColorSchemeMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

    if ('addEventListener' in prefersColorSchemeMediaQueryList) {
      prefersColorSchemeMediaQueryList.addEventListener('change', () => {
        // Only react to OS changes when the user's setting is 'OS'.
        // If the user explicitly chose 'Light' or 'Dark', don't override their preference.
        const currentColorScheme = store.getState().base.get('colorScheme');
        if (currentColorScheme === 'OS') {
          // Dispatch a dedicated action to trigger a re-render.
          // loadTheme() in Entry.render() will re-query the OS preference
          // via matchMedia and apply the correct colors.
          store.dispatch({ type: 'OS_COLOR_SCHEME_CHANGED' });
        }
      });
    }
  }

  return (next) => (action) => next(action);
};
