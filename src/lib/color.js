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

// assumes var is either a longform-hex or rgb(a) color value
export const readRgbaVariable = (varName) => {
  const varValue = getComputedStyle(document.documentElement).getPropertyValue(varName);
  if (varValue.charAt(0) === '#') {
    const hexValue = varValue.substring(1, 7);
    return rgbaObject(
      parseInt(hexValue.substring(0, 2), 16),
      parseInt(hexValue.substring(2, 4), 16),
      parseInt(hexValue.substring(4, 6), 16),
      1
    );
  } else {
    const rgbaValues = [...varValue.matchAll(/[0-9.]+/g)].map((a) => +a[0]);
    if (rgbaValues.length === 3) {
      return rgbaObject(...rgbaValues, 0);
    } else if (rgbaValues.length === 4) {
      return rgbaObject(...rgbaValues);
    } else {
      return rgbaObject(0, 0, 0, 0);
    }
  }
};

const themes = {
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
};

export const loadTheme = (theme) => {
  if (theme && themes[theme]) {
    const style = document.documentElement.style;
    Object.entries(themes[theme]).forEach(([k, v]) => style.setProperty(k, v));

    // set theme color on android
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', themes[theme]['--base3']);
  }
};
