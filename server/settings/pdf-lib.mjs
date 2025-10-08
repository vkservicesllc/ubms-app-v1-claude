const fs = require('fs')
const path = require('path')

const fontPath = {
    hurricane: path.join(__dirname, '../assests/fonts/hurricane/regular.ttf'),
    mrsSaintDelafield: path.join(__dirname, '../assests/fonts/mrs-saint-delafield/regular.ttf'),
    sansation: path.join(__dirname, '../assests/fonts/sansation/regular.ttf'),
    sansationBold: path.join(__dirname, '../assests/fonts/sansation/bold.ttf'),
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
    static MrsSaintDelafield = fs.readFileSync(fontPath.mrsSaintDelafield)
    static Sansation = fs.readFileSync(fontPath.sansation)
    static SansationBold = fs.readFileSync(fontPath.sansationBold)
}