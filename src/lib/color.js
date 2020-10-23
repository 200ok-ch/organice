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

export const darkModeColors = () => {
  const root = document.documentElement;
  root.style.setProperty('--base03', '#fdf6e3');
  root.style.setProperty('--base02', '#eee8d5');
  root.style.setProperty('--base01', '#93a1a1');
  root.style.setProperty('--base00', '#839496');
  root.style.setProperty('--base0', '#657b83');
  root.style.setProperty('--base1', '#586e75');
  root.style.setProperty('--base2', '#073642');
  root.style.setProperty('--base3', '#002b36');
  // switch transparent color variants
  root.style.setProperty('--base01-soft', 'rgba(147, 161, 161, 0.4)');
  root.style.setProperty('--base00-soft', 'rgba(131, 148, 150, 0.75)');
  root.style.setProperty('--base0-soft', 'rgba(101, 123, 131, 0.75)');
  root.style.setProperty('--base1-soft', 'rgba(88, 110, 117, 0.4)');
  // switch magenta and violet
  root.style.setProperty('--magenta', '#6c71c4');
  root.style.setProperty('--violet', '#d33682');
};
export const lightModeColors = () => {
  const root = document.documentElement;
  root.style.setProperty('--base3', '#fdf6e3');
  root.style.setProperty('--base2', '#eee8d5');
  root.style.setProperty('--base1', '#93a1a1');
  root.style.setProperty('--base0', '#839496');
  root.style.setProperty('--base00', '#657b83');
  root.style.setProperty('--base01', '#586e75');
  root.style.setProperty('--base02', '#073642');
  root.style.setProperty('--base03', '#002b36');
  // switch transparent color variants
  root.style.setProperty('--base01-soft', 'rgba(88, 110, 117, 0.4)');
  root.style.setProperty('--base00-soft', 'rgba(101, 123, 131, 0.75)');
  root.style.setProperty('--base0-soft', 'rgba(131, 148, 150, 0.75)');
  root.style.setProperty('--base1-soft', 'rgba(147, 161, 161, 0.4)');
  // switch magenta and violet
  root.style.setProperty('--magenta', '#d33682');
  root.style.setProperty('--violet', '#6c71c4');
};
