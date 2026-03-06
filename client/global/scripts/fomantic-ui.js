const baseWidth = 1920
const defaultFontSize = 14  // px
const vw = window.innerWidth

let newFontSize = defaultFontSize
if (vw < baseWidth) newFontSize = defaultFontSize * (vw / baseWidth)

console.log({
    vw, defaultFontSize, newFontSize,
})

document.documentElement.style.fontSize = newFontSize + 'px'