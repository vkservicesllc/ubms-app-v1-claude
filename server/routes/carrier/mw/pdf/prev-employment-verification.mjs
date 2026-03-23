let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/logo/'

import fs from 'fs'
import moment from 'moment'
import { Employment } from '../../../../tools/core/driver.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import { drawCheckBox, wrapText } from './components.mjs'


export default async (employment = {}, method) => {

//console.log(employment) //! TEMP
    const { employer, position, startedOn, leftOn, phone, address, application = {} } = employment
    const { phone: appPhone, ssn: appSsn, finishedAt } = application
    const { carrier, carrierPhone, carrierFax, carrierAddress } = application

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const applicant = new Person(application).fullName()
    pdfDoc.setTitle(`${applicant} - Employment Verification (${employer})`)

    const { width, height, marginX, marginY } = pdfParams.letter
    let x = marginX, y = height - marginY, text, textWidth, lines
    const fieldHeight = 27, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
        signature: await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield),
    }

    const size = {
        title: 14,
        subtitle: 12,
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

    page.drawText(carrier, { x, y, font: font.title, size: size.title * 1.2, color: color.title })
    y -= 20
    text = carrierAddress.address1
    if (carrierAddress.address2) text += `, ${carrierAddress.address2}`
    page.drawText(text, { x, y, font: font.title, size: size.title, color: color.title })
    y -= 20
    page.drawText(`${carrierAddress.city}, ${carrierAddress.state} ${carrierAddress.zip}`, {
        x, y, font: font.title, size: size.title, color: color.title
    })
    y -= 20
    text = 'Phone:'
    textWidth = font.title.widthOfTextAtSize(text, size.subtitle)
    page.drawText(text, { x, y, font: font.title, size: size.subtitle, color: color.title })
    page.drawText(formatTel(carrierPhone), { x: x + textWidth + gap / 2, y, font: font.title, size: size.title, color: color.title })
    y -= 20
    text = 'Fax:'
    page.drawText(text, { x, y, font: font.title, size: size.subtitle, color: color.title })
    page.drawText(carrierFax ? formatTel(carrierFax) : '', { x: x + textWidth + gap / 2, y, font: font.title, size: size.title, color: color.title })

    y -= fieldHeight

    text = "Applicant's Full Name:"
    let colTextWidth1 = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += colTextWidth1 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 280, y: y - 1 },
        color: color.line,
    })
    page.drawText(applicant, {
        x: x + 2, y: y + 2,
        font: font.title, size: size.value * 1.05,
    })
    x += 280 + 10
    text = "Applicant's SSN:"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    let text2 = 'Application Date:'
    let colTextWidth2 = font.label.widthOfTextAtSize(text2, size.label)
    page.drawText(text, { x: x + (colTextWidth2 - textWidth), y, font: font.label, size: size.label })
    x += colTextWidth2 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: width - marginX, y: y - 1 },
        color: color.line,
    })
    page.drawText(formatSsn(appSsn, 'x'), {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })

    x = marginX
    y -= gap * 2.4
    text = 'Former Employer:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x: x + (colTextWidth1 - textWidth), y, font: font.label, size: size.label })
    x += colTextWidth1 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 280, y: y - 1 },
        color: color.line,
    })
    page.drawText(employer, {
        x: x + 2, y: y + 2,
        font: font.title, size: size.value * 1.05,
    })
    x += 280 + 10
    page.drawText(text2, { x, y, font: font.label, size: size.label })
    x += colTextWidth2 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: width - marginX, y: y - 1 },
        color: color.line,
    })
    page.drawText(moment(finishedAt).format(dateFormat), {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })

    x = marginX + colTextWidth1 + gap - 4
    y -= gap * 2.4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: width - marginX, y: y - 1 },
        color: color.line,
    })
    let emplAddress = address.address1
    if (address.address2) emplAddress += ', ' + address.address2
    page.drawText(`${emplAddress}, ${address.city}, ${address.state} ${address.zip}`, {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x = marginX
    y -= fieldHeight
    page.drawText('Federal Regulations (49 CFR Parts 40, 382, and 391) require prior employers to respond to this inquiry.', {
        x, y, font: font.title, size: size.label, color: color.label,
    })

    x = marginX
    y -= fieldHeight

    page.drawText('The above-named applicant has submitted an application for a driver position with our company and has indicated that they were', {
        x, y, font: font.label, size: size.label, color: color.label,
    })
    x = marginX
    y -= gap * 1.7
    text = 'employed by your organization as a'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 150, y: y - 1 },
        color: color.line,
    })
    page.drawText(position, {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 150 + gap / 2
    text = 'from'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 75, y: y - 1 },
        color: color.line,
    })
    page.drawText(moment(startedOn).format(dateFormat), {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 75 + gap / 2
    text = 'to'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 75, y: y - 1 },
        color: color.line,
    })
    page.drawText(leftOn ? moment(leftOn).format(dateFormat) : 'Present Day', {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 75 + 2
    page.drawText('.', { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight

    text = "Is the employment information listed above accurate according to your company's records?"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'No'
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5
    text = 'If "NO", provide correct details.'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap
    text = 'Start Date:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 70, y: y - 1 },
        color: color.line,
    })
    x += 70 + gap
    text = 'End Date:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 70, y: y - 1 },
        color: color.line,
    })
    x += 70 + gap
    text = 'Position:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: width - marginX, y: y - 1 },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight
    const { termType } = Employment.list
    text = 'Reason for Leaving:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = termType.r
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = termType.l
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = termType.d
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap * 1.4
    text = 'Eligible for rehire?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    page.drawText('Review', { x, y, font: font.value, size: size.value * .9 })

    x = marginX
    y -= fieldHeight

    text = 'Was the employee required to operate a motor vehicle as part of their job duties?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'No'
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5
    text = 'If "YES", complete the remaining sections of the form.'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight / 2.5
    page.drawLine({
        start: { x, y },
        end: { x: width - marginX, y },
        color: color.line,
    })
    y -= fieldHeight / 1.2

    text = 'Subject to FMCSR?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'No'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap * 1.2

    text = 'Subject to DOT Drug & Alcohol Test?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, 12)
    x += 16
    text = 'No'
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })


    //! FORM continues

    // x = marginX
    // y -= fieldHeight * 3

    // text = 'I authorize the release of information regarding my employment, including services performed, '
    // text += 'character, conduct, and drug and alcohol testing records, to the company named above. '
    // text += 'I release my former employer and its representatives from any and all liability '
    // text += 'that may result from providing such information.'
    // // text = 'Federal Regulations (49 CFR Parts 40, 382, and 391) require prior employers to respond to this inquiry.'
    // lines = wrapText(text, width, font.label, size.label, marginX, padding)
    // lines.forEach(line => {
    //     page.drawText(line, {
    //         x: marginX, y,
    //         font: font.label, size: size.label, color: color.label,
    //     })
    //     y -= gap * 1.2
    // })


    return await pdfDoc.save()
}