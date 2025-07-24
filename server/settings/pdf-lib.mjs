const fs = require('fs')
const path = require('path')

const fontPath = {
    hurricane: path.join(__dirname, '../fonts/hurricane/regular.ttf'),
}

export default {
    letter: {
        width: 612,
        height: 792,
        marginX: 35,
        marginY: 35,
    },
}

export class CustomFonts {
    static Hurricane = fs.readFileSync(fontPath.hurricane)
}