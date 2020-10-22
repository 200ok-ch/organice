// Hard-wrap long lines - from https://codereview.stackexchange.com/a/171857
export const formatTextWrap = (text, maxLineLength) => {
  const words = text.replace(/[\r\n]+/g, ' ').split(' ');
  let lineLength = 0;

  return words.reduce((result, word) => {
    if (lineLength + word.length >= maxLineLength) {
      lineLength = word.length;
      return result + `\n${word}`; // don't add spaces upfront
    } else {
      lineLength += word.length + (result ? 1 : 0);
      return result ? result + ` ${word}` : `${word}`; // add space only when needed
    }
  }, '');
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
  // switch magenta and violet
  root.style.setProperty('--magenta', '#6c71c4');
  root.style.setProperty('--violet', '#d33682');
};
export const brightModeColors = () => {
  const root = document.documentElement;
  root.style.setProperty('--base3', '#fdf6e3');
  root.style.setProperty('--base2', '#eee8d5');
  root.style.setProperty('--base1', '#93a1a1');
  root.style.setProperty('--base0', '#839496');
  root.style.setProperty('--base00', '#657b83');
  root.style.setProperty('--base01', '#586e75');
  root.style.setProperty('--base02', '#073642');
  root.style.setProperty('--base03', '#002b36');
  // switch magenta and violet
  root.style.setProperty('--magenta', '#d33682');
  root.style.setProperty('--violet', '#6c71c4');
};
