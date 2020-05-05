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
