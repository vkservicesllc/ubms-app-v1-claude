let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/logo/'

import fs from 'fs'
import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'


export default async (employment = {}) => {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
console.log(employment)
    return await pdfDoc.save()
}