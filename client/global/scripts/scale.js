const baseWidth = 1920;
const defaultFontSize = 14; // px
const minFontSize = 11;
const vw = window.innerWidth;

let newFontSize = defaultFontSize;
if (vw < baseWidth) newFontSize = defaultFontSize * (vw / baseWidth);
if (newFontSize < minFontSize) newFontSize = minFontSize;

document.documentElement.style.fontSize = newFontSize + 'px';
