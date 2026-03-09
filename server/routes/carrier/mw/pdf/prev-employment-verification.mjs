let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/logo/'

import fs from 'fs'
import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import { drawCheckBox } from './components.mjs'


export default async (employment = {}) => {

console.log(employment) //! TEMP

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, vLineXOffsets, text, textWidth, lines
    const fieldHeight = 33, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
        signature: await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield),
    }

    const size = {
        title: 12,
        section: 9.5,
        label: 8.9,
        value: 11.2,
        signature: 20,
    }
    const color = {
        title: rgb(0, 0, 0),
        line: rgb(0.2, 0.2, 0.2),
        value: rgb(0, 0, 0),
        signature: rgb(0, 0, 1),
    }
    const offset = {
        labelY: 12,
        valueY: 27,
    }

    const page = pdfDoc.addPage([width, height])
    text = 'Employment Verification'
    textWidth = font.title.widthOfTextAtSize(text, size.title)
    page.drawText(text, {
        x: width / 2 - textWidth / 2, y,
        font: font.title, size: size.title, color: color.title,
    })

    return await pdfDoc.save()
}