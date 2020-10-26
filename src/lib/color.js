// Interpolates between two colors.
// colorA and colorB should be objects with keys {r, g, b, a}.
// interpolationFactor should be a number between 0 and 1 representing how far from colorA to
// colorB it should interpolate.
// An object with keys {r, g, b, a} will be returned.
export const interpolateColors = (colorA, colorB, interpolationFactor) => {
  return {
    r: parseInt((colorB.r - colorA.r) * interpolationFactor + colorA.r, 10),
    g: parseInt((colorB.g - colorA.g) * interpolationFactor + colorA.g, 10),
    b: parseInt((colorB.b - colorA.b) * interpolationFactor + colorA.b, 10),
    a: (colorB.a - colorA.a) * interpolationFactor + colorA.a,
  };
};

export const rgbaObject = (r, g, b, a) => {
  return { r, g, b, a };
};

export const rgbaString = (rgba) => {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};

const themes = {
  Solarized: {
    Light: {
      '--base3': '#fdf6e3',
      '--base2': '#eee8d5',
      '--base1': '#93a1a1',
      '--base0': '#839496',
      // highlights
      '--base00': '#657b83',
      '--base01': '#586e75',
      '--base02': '#073642',
      '--base03': '#002b36',
      // shadows
      '--base0-soft': 'rgba(131, 148, 150, 0.75)',
      // highlighted backgrounds
      '--base1-soft': 'rgba(147, 161, 161, 0.4)',
      // header colors
      '--blue': '#268bd2',
      '--green': '#859900',
      '--cyan': '#2aa198',
      '--yellow': '#b58900',
      // additional colors
      '--orange': '#cb4b16',
      '--red': '#dc322f',
      '--magenta': '#d33682',
      '--violet': '#6c71c4',
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
    Dark: {
      // backgrounds
      '--base3': '#002b36',
      '--base2': '#073642',
      '--base1': '#586e75',
      '--base0': '#657b83',
      // highlights
      '--base03': '#fdf6e3',
      '--base02': '#eee8d5',
      '--base01': '#93a1a1',
      '--base00': '#839496',
      // shadows
      '--base0-soft': 'rgba(101, 123, 131, 0.75)',
      // highlighted backgrounds
      '--base1-soft': 'rgba(88, 110, 117, 0.4)',
      // header colors
      '--blue': '#268bd2',
      '--green': '#859900',
      '--cyan': '#2aa198',
      '--yellow': '#b58900',
      // additional colors
      '--orange': '#cb4b16',
      '--red': '#dc322f',
      '--magenta': '#6c71c4',
      '--violet': '#d33682',
      // table highlight
      '--green-soft:': 'rgba(133, 153, 0, 0.28)',
    },
  },
  Gruvbox: {
    Light: {
      /*
     gruvbox light
     see https://github.com/morhetz/gruvbox for palette
     this theme uses the 'faded' version of the color palette
   */
      // background and highlights
      '--base3': '#fbf1c7', // bg0
      '--base2': '#d5c4a1', // bg2
      '--base1': '#bdae93', // bg3
      '--base0': '#a89984', // bg4
      '--base00': '#7c6f64', // fg4
      '--base01': '#665c54', // fg3
      '--base02': '#504945', // fg2
      '--base03': '#282828', // fg0
      // transparent versions
      '--base0-soft': 'rgba(168, 153, 132, 0.75)',
      '--base1-soft': 'rgba(189, 174, 147, 0.4)',
      // header colors
      '--blue': '#076678',
      '--green': '#79740e',
      '--cyan': '#427b58',
      '--yellow': '#b57614',
      // additional colors
      '--orange': '#af3a03',
      '--red': '#9d0006',
      '--magenta': '#8f3f71', // faded purple
      '--violet': '#b16286', // neutral purple
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
    Dark: {
      /*
     gruvbox dark
     see https://github.com/morhetz/gruvbox for palette
     this theme uses the 'neutral' version of the color palette
   */
      // background and highlights
      '--base3': '#282828', // bg0
      '--base2': '#504945', // bg2
      '--base1': '#665c54', // bg3
      '--base0': '#7c6f64', // bg4
      '--base00': '#a89984', // fg4
      '--base01': '#bdae93', // fg3
      '--base02': '#d5c4a1', // fg2
      '--base03': '#fbf1c7', // fg0
      // transparent versions
      '--base0-soft': 'rgba(20, 20, 20, 0.75)',
      '--base1-soft': 'rgba(20, 20, 20, 0.4)',
      // header colors
      '--blue': '#458588',
      '--green': '#98971a',
      '--cyan': '#689d6a',
      '--yellow': '#d79921',
      // additional colors
      '--orange': '#d65d0e',
      '--red': '#cc241d',
      '--magenta': '#b16286', // neutral purple
      '--violet': '#d3869b', // bright purple
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
  },
  One: {
    Light: {
      /*
      adaptation of atom one light theme
      https://github.com/atom/atom/tree/master/packages/one-light-ui
    */
      // background and highlights
      '--base03': '#383A42',
      '--base02': '#585A5F',
      '--base01': '#79797C',
      '--base00': '#999999',
      '--base0': '#A0A1A7',
      '--base1': '#C0C0C4',
      '--base2': '#DFE0E2',
      '--base3': '#FFFFFF',
      // transparent versions
      '--base0-soft': 'rgba(160, 161, 167, 0.75)',
      '--base1-soft': 'rgba(192, 192, 196, 0.4)',
      // header colors
      '--blue': '#1492ff',
      '--green': '#2db448',
      '--cyan': '#D831B0', // pink
      '--yellow': '#d5880b',
      // additional colors
      '--orange': '#f42a2a', //red
      '--red': '#f42a2a',
      '--magenta': 'hsl(208, 100%, 56%)', // blue
      '--violet': '#D831B0', // pink
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
    Dark: {
      /*
      adaptation of atom one dark theme
      https://github.com/atom/atom/tree/master/packages/one-dark-ui
    */
      // background and highlights
      '--base03': '#abb2bf',
      '--base02': '#9198A5',
      '--base01': '#767D8A',
      '--base00': '#5c6370',
      '--base0': '#4c5263',
      '--base1': '#404553',
      '--base2': '#343944',
      '--base3': '#282c34',
      // transparent versions
      '--base0-soft': 'rgba(76, 82, 99, 0.75)',
      '--base1-soft': 'rgba(88, 110, 117, 0.4)',
      // header colors
      '--blue': 'rgb(100, 148, 237)',
      '--green': 'rgb(115, 201, 144)',
      '--cyan': 'rgb(204, 133, 51)', //orange
      '--yellow': 'rgb(226, 192, 141)',
      // additional colors
      '--orange': 'rgb(255, 99, 71)', //red
      '--red': '#D831B0', //pink
      '--magenta': 'rgb(0, 136, 255)', //blue
      '--violet': '#d33682',
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
  },
  Smyck: {
    Light: {},
    Dark: {
      /*
        see http://color.smyck.org/ for palette
      */
      // background and highlights
      '--base3': '#000000',
      '--base2': '#1F1F1F',
      '--base1': '#3E3E3E',
      '--base0': '#5D5D5D',
      '--base00': '#B0B0B0',
      '--base01': '#C8C8C8',
      '--base02': '#DFDFDF',
      '--base03': '#F7F7F7',
      // transparent versions
      '--base0-soft': 'rgba(31, 31, 31, 0.75)',
      '--base1-soft': 'rgba(62, 62, 62, 0.4)',
      // header colors
      '--blue': '#72B3CC',
      '--green': '#8EB33B',
      '--cyan': '#218693',
      '--yellow': '#D0B03C',
      // additional colors
      '--orange': '#C75646',
      '--red': '#E09690',
      '--magenta': '#77DFD8',
      '--violet': '#FBB1F9',
      // table highlight
      '--green-soft': 'rgba(133, 153, 0, 0.28)',
    },
  },
};

export const loadTheme = (theme = 'Solarized', colorScheme = 'Light') => {
  const style = document.documentElement.style;
  Object.entries(themes[theme][colorScheme]).forEach(([k, v]) => style.setProperty(k, v));

  // set theme color on android
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute('content', themes[theme]['--base3']);
};
