let { DIR__PATH: dir } = Bun.env
dir += '/uploads/driver/'

import fs from 'fs'
import moment, { duration } from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import Driver, { Application } from '../../../../tools/core/driver.mjs'
import { getFiles } from '../../../../tools/utils/fs.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'


export default async application => {
    if (!application) return

    const applicant = new Person(application)
    const { driverId, id } = application
    const files = await getFiles(dir, false)
    const title = `${applicant.fullName()} - Driver's License`

    dir += `${driverId}/drivers-license/${id}`
    
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    pdfDoc.setTitle(title)

    const { width, height, marginX, marginY } = pdfParams.letter
    const font = {
        duration: await pdfDoc.embedFont(StandardFonts.Helvetica),
        side: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    }
    const size = {
        duration: 15,
        side: 12,
    }

    const list = {}
    files.map(file => {
        const [ start, end, side ] = file.split('.')[0].split('_')
        const prop = `${start}_${end}`
        if (!list[prop]) list[prop] = {}
        list[prop].duration = `${moment(start).format('ll')} – ${moment(end).format('ll')}`
        list[prop][side] = {}
        list[prop][side].title = side.toUpperCase()
        list[prop][side].path = `${dir}/${file}`
    })

    for (const key in list) {
        const item = list[key]
        const page = pdfDoc.addPage([width, height])
        let y = height - marginY

        let text = item.duration
        let textWidth = font.duration

        //! continue...
    }
}