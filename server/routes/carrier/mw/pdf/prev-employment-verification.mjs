let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/logo/'

import fs from 'fs'
import moment from 'moment'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import { drawCheckBox, wrapText } from './components.mjs'


export default async (employment = {}) => {

//console.log(employment) //! TEMP
    const { employer, phone, address, application, carrier = {} } = employment
    const { phone: appPhone, ssn: appSsn, finishedAt } = application

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const applicant = new Person(application).fullName()
    pdfDoc.setTitle(`${applicant} - Employment Verification`)

    const { width, height, marginX, marginY } = pdfParams.letter
    let x = marginX, y = height - marginY, text, textWidth, lines
    const fieldHeight = 33, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
        signature: await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield),
    }

    const size = {
        title: 14,
        section: 9.5,
        label: 9.4,
        value: 11.7,
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
    y -= fieldHeight

    text = "Applicant's Full Name:"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 275, y: y - 1 },
        color: color.line,
    })
    page.drawText(applicant, {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 275 + 10
    // text = 'Application Date:'
    text = "Applicant's SSN:"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap - 4
    //
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: width - marginX, y: y - 1 },
        color: color.line,
    })
    page.drawText(formatSsn(appSsn), {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    // page.drawText(moment(finishedAt).format(dateFormat), {
    //     x: x + 2, y: y + 2,
    //     font: font.value, size: size.value,
    // })

    // x = marginX
    // y -= fieldHeight

    // text = "Applicant's SSN"
    // textWidth = font.label.widthOfTextAtSize(text, size.label)



    x = marginX
    y -= fieldHeight

    text = 'I authorize the release of information regarding my employment, including services performed, '
    text += 'character, conduct, and drug and alcohol testing records, to the company named above. '
    text += 'I release my former employer and its representatives from any and all liability '
    text += 'that may result from providing such information.'
    // text = 'Federal Regulations (49 CFR Parts 40, 382, and 391) require prior employers to respond to this inquiry.'
    lines = wrapText(text, width, font.label, size.label, marginX, padding)
    lines.forEach(line => {
        page.drawText(line, {
            x: marginX, y,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap * 1.2
    })
    y -= gap / 2
    page.drawText('Federal Regulations (49 CFR Parts 40, 382, and 391) require prior employers to respond to this inquiry.', {
        x, y, font: font.label, size: size.label, color: color.label,
    })


    return await pdfDoc.save()
}