import { rgb } from 'pdf-lib'


export const drawCheckBox = (page, x, y, checked, color = {}, size = 10) => {
    if (!color.line || !color.value) return

    page.drawRectangle({
        x, y, width: size, height: size,
        color: rgb(1, 1, 1),
        borderWidth: 1, borderColor: color.line,
    })

    if (checked === true || checked === 1) {
        page.drawLine({
            start: { x: x + 2, y: y + size / 2 },
            end: { x: x + size * .4, y: y + 1.5 },
            color: color.value,
        })
        page.drawLine({
            start: { x: x + size * .4, y: y + 1.5 },
            end: { x: x + size * .8, y: y + size * .85 },
            color: color.value,
        })
    }
}


export const wrapText = (text, width, font, fontSize, marginX, padding, xGap = 0) => {
    const maxWidth = width - marginX * 2 - padding * 2 - xGap * 2
    const words = text.split(' ')
    const lines = []
    let line = ''
console.log({ width, marginX, padding, xGap })
    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const width = font.widthOfTextAtSize(testLine, fontSize)
        if (width < maxWidth) line = testLine
        else {
            lines.push(line)
            line = word
        }
    }
    if (line) lines.push(line)

    return lines
}