let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/'

import fs from 'fs'
import moment from 'moment'
import { Employment } from '../../../../tools/core/driver.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import { getFiles } from '../../../../tools/utils/fs.mjs'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import { drawCheckBox, drawRadio, wrapText } from './components.mjs'


export default async (employment = {}, method) => {

//console.log(employment) //! TEMP
    const { employer, position, startedOn, leftOn, phone, address, application = {} } = employment
    const { phone: appPhone, ssn: appSsn, finishedAt } = application
    const { carrierCompanyId, carrier, carrierPhone, carrierFax, carrierAddress, carrierLogo } = application

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const applicant = new Person(application).fullName()
    pdfDoc.setTitle(`${applicant} - Employment Verification (${employer})`)

    const { width, height, marginX, marginY } = pdfParams.letter
    let x = marginX, y = height - marginY, text, textWidth, lines
    const fieldHeight = 21, gap = 8, checkGap = 14, padding = 5.4, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
        subsection: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
        signature: await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield),
    }

    const size = {
        title: 12.8,
        subtitle: 11.2,
        section: 9.4,
        label: 9,
        value: 10.7,
        check: 10,
        signature: 11,
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
    textWidth = font.title.widthOfTextAtSize(text, size.title * .85)
    page.drawText(text, {
        x: width / 2 - textWidth / 2, y,
        font: font.title, size: size.title * .85, color: color.title,
    })
    y -= fieldHeight

    page.drawText(carrier, { x, y, font: font.title, size: size.title * 1.2, color: color.title })

    
    //* Company Logo
    const path = dir + carrierCompanyId + '/logo/'
    const files = await getFiles(path, false)
    let filename

    if (carrierLogo && files.length) {
        const finishedOn = finishedAt.split(' ')[0]
        let x = 0

        for (let i = 0; i < files.length; i++) {
            const date = files[i].split(' ')[0]
            if (finishedOn < date) continue
            x = i
            break
        }

        filename = files[x]
        const imgBytes = fs.readFileSync(`${path}/${filename}`)
        const img = await pdfDoc.embedPng(imgBytes)
        const imgWidth = img.width
        const imgHeight = img.height
        const maxWidth = 180
        const maxHeight = 80
        const widthRatio = maxWidth / imgWidth
        const heightRatio = maxHeight / imgHeight
        const scale = Math.min(widthRatio, heightRatio, 1)
        const drawWidth = imgWidth * scale
        const drawHeight = imgHeight * scale
        page.drawImage(img, {
            x: width - marginX - drawWidth, y: y - drawHeight + gap * 1.75,
            width: drawWidth,
            height: drawHeight,
        })
    }

    y -= 16
    text = carrierAddress.address1
    if (carrierAddress.address2) text += `, ${carrierAddress.address2}`
    page.drawText(text, { x, y, font: font.title, size: size.title, color: color.title })
    y -= 16
    page.drawText(`${carrierAddress.city}, ${carrierAddress.state} ${carrierAddress.zip}`, {
        x, y, font: font.title, size: size.title, color: color.title
    })
    y -= 16
    text = 'Phone:'
    textWidth = font.title.widthOfTextAtSize(text, size.subtitle)
    page.drawText(text, { x, y, font: font.title, size: size.subtitle, color: color.title })
    page.drawText(formatTel(carrierPhone), { x: x + textWidth + gap / 2, y, font: font.title, size: size.title, color: color.title })
    y -= 16
    text = 'Fax:'
    page.drawText(text, { x, y, font: font.title, size: size.subtitle, color: color.title })
    page.drawText(carrierFax ? formatTel(carrierFax) : '', { x: x + textWidth + gap / 2, y, font: font.title, size: size.title, color: color.title })

    y -= fieldHeight * 1.2

    text = "Applicant's Full Name:"
    let colTextWidth1 = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += colTextWidth1 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 300, y: y - 1 },
        color: color.line,
    })
    page.drawText(applicant, {
        x: x + 2, y: y + 2,
        font: font.title, size: size.value * 1.05,
    })
    x += 300 + 10
    text = "Applicant's SSN:"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    let text2 = 'Application Date:'
    let colTextWidth2 = font.label.widthOfTextAtSize(text2, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
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
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += colTextWidth1 + gap - 4
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 300, y: y - 1 },
        color: color.line,
    })
    page.drawText(employer, {
        x: x + 2, y: y + 2,
        font: font.title, size: size.value * 1.05,
    })
    x += 300 + 10
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

    // x = marginX + colTextWidth1 + gap - 4
    // y -= gap * 2.4
    // page.drawLine({
    //     start: { x, y: y - 1 },
    //     end: { x: width - marginX, y: y - 1 },
    //     color: color.line,
    // })
    // let emplAddress = address.address1
    // if (address.address2) emplAddress += ', ' + address.address2
    // page.drawText(`${emplAddress}, ${address.city}, ${address.state} ${address.zip}`, {
    //     x: x + 2, y: y + 2,
    //     font: font.value, size: size.value,
    // })

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
        end: { x: x + 65, y: y - 1 },
        color: color.line,
    })
    page.drawText(moment(startedOn).format(dateFormat), {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 65 + gap / 2
    text = 'to'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 65, y: y - 1 },
        color: color.line,
    })
    page.drawText(leftOn ? moment(leftOn).format(dateFormat) : 'Present Day', {
        x: x + 2, y: y + 2,
        font: font.value, size: size.value,
    })
    x += 65 + 2
    page.drawText('.', { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight

    text = "Is the employment information listed above accurate according to your company's records?"
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
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
        end: { x: x + 65, y: y - 1 },
        color: color.line,
    })
    x += 65 + gap
    text = 'End Date:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y: y - 1 },
        end: { x: x + 65, y: y - 1 },
        color: color.line,
    })
    x += 65 + gap
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
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = termType.r
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = termType.l
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = termType.d
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + 2
    text = '(Explain)'
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
    text = 'Eligible for rehire?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    page.drawText('Review', { x, y, font: font.value, size: size.value * .9 })

    x = marginX
    y -= fieldHeight

    text = 'Was the employee required to operate a motor vehicle as part of their job duties?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5
    text = 'If "YES", please complete the remaining sections of the form.'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight / 2.5
    page.drawLine({
        start: { x, y },
        end: { x: width - marginX, y },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight

    page.drawText('Experience', { x, y, font: font.section, size: size.section })

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Vehicles:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    for (const t in Employment.list.vehicle.type) {
        const type = Employment.list.vehicle.type[t]

        drawCheckBox(page, x, y - 2, false, color, size.check)
        x += checkGap
        textWidth = font.value.widthOfTextAtSize(type, size.value * .9 )
        page.drawText(type, { x, y, font: font.value, size: size.value * .9 })
        x += textWidth + gap
    }
    text = 'Other'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 100, y },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Trailers:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    for (const st in Employment.list.vehicle.semiTrailer) {
        const trailer = Employment.list.vehicle.semiTrailer[st]

        drawCheckBox(page, x, y - 2, false, color, size.check)
        x += checkGap
        textWidth = font.value.widthOfTextAtSize(trailer, size.value * .9 )
        page.drawText(trailer, { x, y, font: font.value, size: size.value * .9 })
        x += textWidth + gap
    }
    text = 'Other'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 100, y },
        color: color.line,
    })
    x += 100 + gap
    text = 'Length:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 35, y },
        color: color.line,
    })
    x += 36
    text = 'ft'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Haul Regions:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    for (const prop in Employment.list.haulRegion) {
        const trailer = Employment.list.haulRegion[prop]

        drawCheckBox(page, x, y - 2, false, color, size.check)
        x += checkGap
        textWidth = font.value.widthOfTextAtSize(trailer, size.value * .9 )
        page.drawText(trailer, { x, y, font: font.value, size: size.value * .9 })
        x += textWidth + gap
    }

    x = marginX
    y -= fieldHeight

    page.drawText('Safety & Compliance', { x, y, font: font.section, size: size.section })

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Safe and efficient driver:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap * 1.5

    text = 'Responsible for maintaining logs:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap * 1.2

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Subject to FMCSR:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap * 1.5

    text = 'Subject to DOT Drug & Alcohol Testing:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })

    x = marginX
    y -= fieldHeight / 1.2

    text = 'Was the driver involved in any accidents within the past three years?'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap * 1.2
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })

    x = marginX
    y -= fieldHeight / 1.5
    text = 'If "YES", please report the accident by completing the information below.'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })

    x = marginX
    y -= fieldHeight / 1.2
    text = 'Date:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 65, y },
        color: color.line,
    })
    x += 65 + gap * 1.5
    text = 'Description:'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: width - marginX, y },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight / 1.2
    drawCheckBox(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'DOT Reportable'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Preventable'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawCheckBox(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'HazMat'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    text = '# Injuries'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 40, y },
        color: color.line,
    })
    x += 40 + gap * 1.5
    text = '# Fatalities'
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 40, y },
        color: color.line,
    })
    x += 40 + gap * 1.5
    text = '# Vehicles Towed '
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page.drawText(text, { x, y, font: font.label, size: size.label })
    x += textWidth + gap / 2
    page.drawLine({
        start: { x, y },
        end: { x: x + 40, y },
        color: color.line,
    })

    // text = '# Preventable'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })
    // x += 22 + gap
    // text = '# Non-Preventable'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })
    // x += 22 + gap
    // text = '# DOT Reportable'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })
    // x += 22 + gap
    // text = '# Injuries'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })
    // x += 22 + gap
    // text = '# Fatalities'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })
    // x += 22 + gap
    // text = '# Hazmat'
    // textWidth = font.label.widthOfTextAtSize(text, size.label)
    // page.drawText(text, { x, y, font: font.label, size: size.label })
    // x += textWidth + gap / 2
    // page.drawLine({
    //     start: { x, y },
    //     end: { x: x + 22, y },
    //     color: color.line,
    // })



    //! ACCIDENT LIST


    x = marginX
    y -= fieldHeight

    text = 'Drug & Alcohol'
    textWidth = font.section.widthOfTextAtSize(text, size.section)
    page.drawText(text, { x, y, font: font.section, size: size.section })
    x += textWidth + 5
    text = '(to be accompanied by an appropriate drug and alcohol release)'
    page.drawText(text, { x, y, font: font.subsection, size: size.section * .9 })

    x = marginX
    y -= fieldHeight / 1.2

    text = "In the three years prior to the employee's signature date on this release, for DOT-regulated testing:"
    page.drawText(text, { x, y, font: font.label, size: size.label })

    y -= fieldHeight / 1.4

    const lText = 'If you answered "Yes" to any of the above, did the employee complete the return-to-duty process?'
    const lTextWidth = font.label.widthOfTextAtSize(text, size.label) + 7
    const numWidth = 12

    page.drawText('1.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText('Did the employee have any alcohol tests with a result of 0.04 or higher?', {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5

    page.drawText('2.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText('Did the employee have any verified positive drug tests?', {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5

    page.drawText('3.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText('Did the employee refuse to submit to a required test?', {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5

    page.drawText('4.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText('Did the employee commit any other violations of DOT drug and alcohol testing regulations?', {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5

    page.drawText('5.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText('Did a previous employer report a drug or alcohol rule violation regarding this employee?', {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x = marginX
    y -= fieldHeight / 1.5

    page.drawText('6.', { x, y, font: font.label, size: size.label })
    x += numWidth
    page.drawText(lText, {
        x, y, font: font.label, size: size.label,
    })
    x += lTextWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'Yes'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })
    x += textWidth + gap
    drawRadio(page, x, y - 2, false, color, size.check)
    x += checkGap
    text = 'No'
    textWidth = font.value.widthOfTextAtSize(text, size.value * .9 )
    page.drawText(text, { x, y, font: font.value, size: size.value * .9 })

    // x = marginX
    // y -= fieldHeight / 1.2
    // page.drawText('Note:', { x, y, font: font.label, size: size.label * .9 })
    // y -= fieldHeight / 1.65
    // page.drawText(`• If you answered "Yes" to item 5, please provide the previous employer's report.`, {
    //     x, y, font: font.label, size: size.label * .9,
    // })
    // y -= fieldHeight / 1.75
    // page.drawText('• If you answered "Yes" to item 6, please provide the corresponding return-to-duty documentation (e.g., SAP report(s), follow-up testing records).', {
    //     x, y, font: font.label, size: size.label * .9,
    // })

    x = marginX
    y -= fieldHeight + size.value + gap * 1.2

    page.drawText('Printed Name', { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x, y: y + 9 },
        end: { x: x + 240, y: y + 9 },
        color: color.line,
    })
    x += 240 + gap
    page.drawText('Signature', { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x, y: y + 9 },
        end: { x: x + 200, y: y + 9 },
        color: color.line,
    })
    x += 200 + gap
    page.drawText('Date', { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x, y: y + 9 },
        end: { x: width - marginX, y: y + 9 },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight * 1.4

    page.drawText('Title, Phone, Email', { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x, y: y + 9 },
        end: { x: x + 240 + gap + 200, y: y + 9 },
        color: color.line,
    })
    x += 240 + gap + 200 + gap
    page.drawText('USDOT', { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x, y: y + 9 },
        end: { x: width - marginX, y: y + 9 },
        color: color.line,
    })

    x = marginX
    y -= fieldHeight * 1.2

    text = 'Comments:'
    textWidth = font.label.widthOfTextAtSize(text, size.label * .9)
    page.drawText(text, { x: x + 2, y, font: font.label, size: size.label * .9 })
    page.drawLine({
        start: { x: x + textWidth + gap, y },
        end: { x: width - marginX, y },
        color: color.line,
    })


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