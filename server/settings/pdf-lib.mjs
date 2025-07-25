const fs = require('fs')
const path = require('path')

const fontPath = {
    hurricane: path.join(__dirname, '../fonts/hurricane/regular.ttf'),
    sansation: path.join(__dirname, '../fonts/sansation/regular.ttf'),
    sansationBold: path.join(__dirname, '../fonts/sansation/bold.ttf'),
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
    static Sansation = fs.readFileSync(fontPath.sansation)
    static SansationBold = fs.readFileSync(fontPath.sansationBold)
}