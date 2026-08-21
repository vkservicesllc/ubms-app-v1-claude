const fs = require('fs');
const path = require('path');

const dir = '../assets/fonts';
const fontPath = {
    hurricane: path.join(__dirname, `${dir}/hurricane/regular.ttf`),
    mrsSaintDelafield: path.join(__dirname, `${dir}/mrs-saint-delafield/regular.ttf`),
    momoTrustSans: path.join(__dirname, `${dir}/momo-trust-sans/regular.ttf`),
    momoTrustSansBold: path.join(__dirname, `${dir}/momo-trust-sans/bold.ttf`),
    momoTrustSansSemiBold: path.join(__dirname, `${dir}/momo-trust-sans/semi-bold.ttf`),
    sansation: path.join(__dirname, `${dir}/sansation/regular.ttf`),
    sansationBold: path.join(__dirname, `${dir}/sansation/bold.ttf`),
};

export default {
    letter: {
        width: 612,
        height: 792,
        marginX: 32,
        marginY: 32,
    },
};

export class CustomFonts {
    static Hurricane = fs.readFileSync(fontPath.hurricane);
    static MomoTrustSans = fs.readFileSync(fontPath.momoTrustSans);
    static MomoTrustSansBold = fs.readFileSync(fontPath.momoTrustSansBold);
    static MomoTrustSansSemiBold = fs.readFileSync(fontPath.momoTrustSansSemiBold);
    static MrsSaintDelafield = fs.readFileSync(fontPath.mrsSaintDelafield);
    static Sansation = fs.readFileSync(fontPath.sansation);
    static SansationBold = fs.readFileSync(fontPath.sansationBold);
}
