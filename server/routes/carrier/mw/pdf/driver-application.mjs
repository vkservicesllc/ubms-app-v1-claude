let { DIR__PATH: dir } = Bun.env
dir += '/uploads/business/company/logo/'

import fs from 'fs'
import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams, { CustomFonts } from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel, ein as formatEin } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import Driver, { Application } from '../../../../tools/core/driver.mjs'
import { getFiles } from '../../../../tools/utils/fs.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import Geography from '../../../../../client/global/modules/tools/core/geography.mjs'
import Individual from '../../../../tools/core/individual.mjs'
import { sortArrayByObjectKey } from '../../../../../client/global/modules/tools/utils/sorter.mjs'
import { calculateYearAge } from '../../../../../client/global/modules/tools/utils/date.mjs'


export default async (carrier, application, addresses, violations, accidents, employers) => {
    if (!application) application = {
        legalStatus: [], position: [],
        address: {}, dl: {}, mec: {}, experience: {}, preference: {},
        business: {}, vehicle: {}, beneficiary: {}, emergency: {},
    }
    if (!addresses) addresses = []
    if (!violations) violations = []
    if (!accidents) accidents = []
    if (!employers) employers = []

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const applicant = application?.lastName ? new Person(application) : {}
    const title = applicant.lastName ? `${applicant.fullName()} - Driver Application` : 'Driver Application Blank'
    pdfDoc.setTitle(title)
    const signature = applicant.lastName ? applicant.fullName() : ''

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, vLineXOffsets, text, textWidth, lines
    const fieldHeight = 33, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        carrierB: await pdfDoc.embedFont(CustomFonts.MomoTrustSansBold),
        carrier: await pdfDoc.embedFont(CustomFonts.MomoTrustSansSemiBold),
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
        signature: await pdfDoc.embedFont(CustomFonts.MrsSaintDelafield),
    }
    const size = {
        carrier: 15.5,
        section: 9.5,
        label: 8.9,
        value: 11.2,
        signature: 20,
    }
    const color = {
        carrier: rgb(0, 0, 0),
        line: rgb(0.2, 0.2, 0.2),
        frame: rgb(0.9, 0.9, 0.9),
        section: rgb(0.1, 0.1, 0.1),
        label: rgb(0.2, 0.2, 0.2),
        value: rgb(0, 0, 0),
        signature: rgb(0, 0, 1),
    }
    const offset = {
        labelY: 12,
        valueY: 27,
    }

    const drawCheckBox = (page, x, y, checked, size = 10) => {
        page.drawRectangle({
            x, y, width: size, height: size,
            color: rgb(1, 1, 1),
            borderWidth: 1, borderColor: color.line,
        })

        if (checked === true || checked === 1) {
            page.drawLine({
                start: { x: x + 2, y: y + size / 2 },
                end: { x: x + size * .4, y: y + 1.5 },
                color: color.value,
            })
            page.drawLine({
                start: { x: x + size * .4, y: y + 1.5 },
                end: { x: x + size * .8, y: y + size * .85 },
                color: color.value,
            })
        }
    }

    const wrapText = (text, font, fontSize, xGap = 0) => {
        const maxWidth = width - marginX * 2 - padding * 2 - xGap * 2
        const words = text.split(' ')
        const lines = []
        let line = ''

        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word
            const width = font.widthOfTextAtSize(testLine, fontSize)
            if (width < maxWidth) line = testLine
            else {
                lines.push(line)
                line = word
            }
        }
        if (line) lines.push(line)

        return lines
    }

    const totalPages = 5


    /* COVER PAGE */
    if (carrier) {
        const coverPage = pdfDoc.addPage([width, height])
        const coverPadding = padding / 1.5
        let x
        const { name, address } = carrier
        const { address1, address2, city, state, zip } = address
        const addrLine1 = address1 + (address2 ? `, ${address2}` : '')
        const addrLine2 = `${city}, ${state[0]} ${zip}`
        let { phone, fax } = carrier
        phone = formatTel(phone)
        if (fax) fax = formatTel(fax)

        /* Outline */
        {
            coverPage.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                thickness: 2, color: color.line,
            })
                coverPage.drawLine({
                    start: { x: marginX + coverPadding, y: y - coverPadding },
                    end: { x: width - marginX - coverPadding, y: y - coverPadding },
                    color: color.line,
                })
            coverPage.drawLine({
                start: { x: marginX, y },
                end: { x: marginX, y: y - height + marginY * 2 },
                thickness: 2, color: color.line,
            })
                coverPage.drawLine({
                    start: { x: marginX + coverPadding, y: y - coverPadding },
                    end: { x: marginX + coverPadding, y: y - height + marginY * 2 + coverPadding },
                    color: color.line,
                })
            coverPage.drawLine({
                start: { x: marginX, y: y - height + marginY * 2 },
                end: { x: width - marginX, y: y - height + marginY * 2 },
                thickness: 2, color: color.line,
            })
                coverPage.drawLine({
                    start: { x: marginX + coverPadding, y: y - height + marginY * 2 + coverPadding },
                    end: { x: width - marginX - coverPadding, y: y - height + marginY * 2 + coverPadding },
                    color: color.line,
                })
            coverPage.drawLine({
                start: { x: width - marginX, y },
                end: { x: width - marginX, y: y - height + marginY * 2 },
                thickness: 2, color: color.line,
            })
                coverPage.drawLine({
                    start: { x: width - marginX - coverPadding, y: y - coverPadding },
                    end: { x: width - marginX - coverPadding, y: y - height + marginY * 2 + coverPadding },
                    color: color.line,
                })
        }

        /* Carrier */
        {
            const path = dir + carrier.companyId
            const files = await getFiles(path, false)
            let filename

            /* Cover Sheet Carrier Logo */
            if (carrier.lastLogo && files.length) {
                if (applicant.lastName) {
                    const finishedOn = application.finishedAt.split(' ')[0]
                    let x = 0

                    for (let i = 0; i < files.length; i++) {
                        const date = files[i].split(' ')[0]
                        if (finishedOn < date) continue
                        x = i
                        break
                    }

                    filename = files[x]
                } else {
                    filename = files[0]
                }
                const imgBytes = fs.readFileSync(`${path}/${filename}`)
                const img = await pdfDoc.embedPng(imgBytes)
                const imgWidth = img.width
                const imgHeight = img.height
                const maxWidth = 180
                const maxHeight = 90
                const widthRatio = maxWidth / imgWidth
                const heightRatio = maxHeight / imgHeight
                const scale = Math.min(widthRatio, heightRatio, 1)
                const drawWidth = imgWidth * scale
                const drawHeight = imgHeight * scale
                x = marginX + coverPadding + gap * 1.5
                y = height - marginY - coverPadding - gap * 1.5 - drawHeight
                coverPage.drawImage(img, {
                    x, y,
                    width: drawWidth,
                    height: drawHeight,
                })
                // coverPage.drawLine({
                //     start: { x, y: y + drawHeight },
                //     end: { x, y },
                //     color: color.frame,
                // })
            }

            y = height - marginY - coverPadding - gap * 3
            x = width - marginX - coverPadding - gap * 2
            textWidth = font.carrierB.widthOfTextAtSize(name, size.carrier * 1.1)
            coverPage.drawText(name, {
                x: x - textWidth, y,
                font: font.carrierB, size: size.carrier * 1.1, color: color.carrier,
            })
            y -= fieldHeight / 1.7 + 2
            textWidth = font.carrier.widthOfTextAtSize(addrLine1, size.carrier)
            coverPage.drawText(addrLine1, {
                x: x - textWidth, y,
                font: font.carrier, size: size.carrier, color: color.carrier,
            })
            y -= fieldHeight / 1.7
            textWidth = font.carrier.widthOfTextAtSize(addrLine2, size.carrier)
            coverPage.drawText(addrLine2, {
                x: x - textWidth, y,
                font: font.carrier, size: size.carrier, color: color.carrier,
            })
            y -= fieldHeight / 1.7
            text = 'Phone:'
            let labelWidth = font.label.widthOfTextAtSize(text, size.label * 1.4) + gap / 1.5
            textWidth = font.carrier.widthOfTextAtSize(phone, size.carrier)
            coverPage.drawText(text, {
                x: x - labelWidth - textWidth, y,
                font: font.carrier, size: size.label * 1.4, color: color.carrier,
            })
            coverPage.drawText(phone, {
                x: x - textWidth, y,
                font: font.carrier, size: size.carrier, color: color.carrier,
            })
            if (fax) {
                y -= fieldHeight / 1.7
                text = 'Fax:'
                labelWidth = font.label.widthOfTextAtSize(text, size.label * 1.4) + gap / 1.5
                textWidth = font.carrier.widthOfTextAtSize(fax, size.carrier)
                coverPage.drawText(text, {
                    x: x - labelWidth - textWidth, y,
                    font: font.carrier, size: size.label * 1.4, color: color.carrier,
                })
                coverPage.drawText(fax, {
                    x: x - textWidth, y,
                    font: font.carrier, size: size.carrier, color: color.carrier,
                })
            }
        }

        /* Intro */
        {
            y -= 55
            x = 0
            text = 'Professional Driver Application'
            textWidth = font.section.widthOfTextAtSize(text, size.section * 1.7)
            coverPage.drawText(text, {
                x: width / 2 - textWidth / 2, y,
                font: font.section, size: size.section * 1.7, color: color.section,
            })
            y -= 35

            text = 'Thank you for your interest in joining our team. '
            text += 'Please complete the following application accurately and in full. '
            text += 'This information is essential for evaluating your qualifications and ensuring compliance with applicable regulations. '
            text += 'All statements will be held in strict confidence.'
            lines = wrapText(text, font.label, size.label * 1.55, gap)
            lines.forEach((line, i) => {
                coverPage.drawText(line, {
                    x: marginX + gap * 2 + (!i ? gap * 2 : 0), y,
                    font: font.label, size: size.label * 1.55, color: color.section,
                })
                y -= gap * 2
            })
            y -= 2
            text = 'We are committed to hiring safe, reliable, and responsible drivers who uphold '
            text += 'the highest standards of professionalism and safety on the road.'
            lines = wrapText(text, font.label, size.label * 1.55, gap * 3)
            lines.forEach((line, i) => {
                coverPage.drawText(line, {
                    x: marginX + gap * 2 + (!i ? gap * 2 : 0), y,
                    font: font.label, size: size.label * 1.55, color: color.section,
                })
                y -= gap * 2
            })
            y -= 10
            coverPage.drawText('Before you begin the application, please ensure you:', {
                x: marginX + gap * 2 + gap * 2, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
            y -= gap * 2
            coverPage.drawText("• are at least 18 years old", {
                x: marginX + gap * 2 + gap * 3, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
            y -= gap * 2
            coverPage.drawText("• have a valid driver's license", {
                x: marginX + gap * 2 + gap * 3, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
            y -= gap * 2
            coverPage.drawText("• have a clean driving record", {
                x: marginX + gap * 2 + gap * 3, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
            y -= gap * 2
            coverPage.drawText("• have required permits and credentials", {
                x: marginX + gap * 2 + gap * 3, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
            y -= gap * 2
            coverPage.drawText("• are able to meet DOT and company safety requirements", {
                x: marginX + gap * 2 + gap * 3, y,
                font: font.label, size: size.label * 1.55, color: color.section,
            })
        }

        /* Applicant */
        {
            y -= 50
            x = 0
            text = "Applicant's Information"
            textWidth = font.section.widthOfTextAtSize(text, size.section * 1.5)
            coverPage.drawText(text, {
                x: width / 2 - textWidth / 2, y,
                font: font.section, size: size.section * 1.5, color: color.section,
            })
            y -= 40
            x = marginX + coverPadding + gap * 2

            const fullName = applicant?.lastName ? applicant.fullName('FMLs') : ''
            text = "Full Name:"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(fullName, {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.value, size: size.value * 1.3, color: color.value,
            })
            let lineLength = width - x - textWidth - gap - marginX - coverPadding - gap * 2
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })

            y -= fieldHeight
            let residence = ''
            if (application.address) {
                const { city, state } = application.address
                if (state) residence = `${city}, ${state[0]}`
            }
            text = "Residence (City, State):"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(residence, {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.value, size: size.value * 1.3, color: color.value,
            })
            lineLength = width - x - textWidth - gap - marginX - coverPadding - gap * 2
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })

            y -= fieldHeight
            const { email } = application
            text = "Email:"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(email || '', {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.value, size: size.value * 1.3, color: color.value,
            })
            lineLength = width - x - textWidth - gap - marginX - coverPadding - gap * 2
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })

            y -= fieldHeight
            const age = application?.dob
                ? calculateYearAge(application.dob, moment(application.submittedAt).format('YYYY-MM-DD')) + ''
                : ''
            text = "Age:"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(age, {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.value, size: size.value * 1.3, color: color.value,
            })
            lineLength = 60
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })
            textWidth += lineLength + gap - 2
            text = 'Desired Position:'
            coverPage.drawText(text, {
                x: x + textWidth + gap * 3, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            textWidth += font.label.widthOfTextAtSize(text, size.label * 1.4) + gap * 3 + 5
            const positions = Driver.list.position
            const { position } = application
            let i = 0
            for (const p in positions) {
                drawCheckBox(coverPage, x + textWidth + gap, y - 3, position === p, 15)
                coverPage.drawText(positions[p], {
                    x: x + textWidth + gap + 25, y,
                    font: font.label, size: size.label * 1.4, color: color.section,
                })
                if (i === 1) {
                    x += 127
                    y += 25
                } else y -= 25
                i++
            }

            x = marginX + coverPadding + gap * 2
            y = marginY + coverPadding + gap * 3
            text = "Signature:"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(signature, {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.signature, size: size.signature * 1.1, color: color.signature,
            })
            lineLength = 240
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })
            x += textWidth + lineLength + gap * 2 + padding
            text = "Date:"
            textWidth = font.label.widthOfTextAtSize(text, size.label * 1.4)
            coverPage.drawText(text, {
                x, y,
                font: font.label, size: size.label * 1.4, color: color.section,
            })
            coverPage.drawText(application.finishedAt ? moment(application.finishedAt).format(dateFormat) : '', {
                x: x + textWidth + gap + 2, y: y + 2,
                font: font.value, size: size.value * 1.3, color: color.value,
            })
            lineLength = width - x - textWidth - gap - marginX - coverPadding - gap * 2
            coverPage.drawLine({
                start: { x: x + textWidth + gap - 2, y: y - 1 },
                end: { x: x + textWidth + gap - 2 + lineLength, y: y - 1 },
                color: color.line,
            })
        }


    }


    /* PAGE 1 */
    const page1 = pdfDoc.addPage([width, height])
    text = `Page 1 of ${totalPages}`
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page1.drawText(text, {
        x: width - marginX - textWidth, y: marginY,
        font: font.label, size: size.label / 1.2, color: color.label,
    })
    y = height - marginY

    vLineXOffsets = [3.22, 2.25, 1.46, 1.315, 1.177]

    /* Section 1 */
    {
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page1.drawText('Section 1: Personal Information', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        /* Row 1 */
        {
            const { firstName, middleName, lastName, suffix } = application
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('First Name', {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(firstName || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3
            page1.drawText('Middle Name', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(middleName || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX
            page1.drawText('Last Name', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(lastName ? lastName + (suffix ? `, ${suffix}` : '') : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 2 */
        {
            const { dob, gender, ssn, marital, phone, expansion } = application
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('Date of Birth', {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(dob ? moment(dob).format(dateFormat) : '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3 * 2 / 4
            page1.drawText('Gender', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(gender ? expansion.gender : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX - 18
            page1.drawText('SSN', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(ssn ? formatSsn(ssn) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX / 1.75
            page1.drawText('Marital Status', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(marital ? Individual.list.marital[marital] : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX / 2.41
            page1.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })
            page1.drawText('Phone', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(phone ? formatTel(phone) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 3 */
        {
            let { address1, address2, city, state, zip, since: addrSince } = application.address
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('Street Address', {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(address1 || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[0]
            page1.drawText('Apt/Unit #', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(address2 || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[1]
            page1.drawText('City', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(city || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[2]
            page1.drawText('State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(state || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[3]
            page1.drawText('Zip', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(zip || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[4]
            page1.drawText('Living since', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(addrSince ? moment(addrSince).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

    }

    /* Section 2 */
    {
        addresses = sortArrayByObjectKey(addresses, 'since', false)
        y -= fieldHeight / 2
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page1.drawText('Section 2: Prior residence for the past three years', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        for (let i = 0; i < 3; i++) {
            const address = addresses[i]
            let address1, address2, city, state, zip, since
            if (address) ({ address1, address2, city, state, zip, since } = address)

            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('Street Address', {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(address1 || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[0]
            page1.drawText('Apt/Unit #', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(address2 || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[1]
            page1.drawText('City', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(city || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[2]
            page1.drawText('State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(state ? state : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[3]
            page1.drawText('Zip', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(zip || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[4]
            page1.drawText('Lived since', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(since ? moment(since).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })

            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        const { country } = application.address
        y -= fieldHeight / 1.7
        text = 'Previously lived outside the U.S.'
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        drawCheckBox(page1, marginX + padding, y, !!country)
        page1.drawText(text, {
            x: marginX + padding + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        text = 'Country:'
        page1.drawText(text, {
            x: marginX + padding + 15 + textWidth + gap * 1.4, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth += font.label.widthOfTextAtSize(text, size.label)
        page1.drawText(country ? Geography.list.country[country] : '', {
            x: marginX + padding + 15 + textWidth + gap * 1.4 + padding * 2, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page1.drawLine({
            start: { x: marginX + padding + 15 + textWidth + 15 + padding / 2, y: y - 1 },
            end: { x: marginX + padding + 15 + textWidth + 15 + padding / 2 + 185, y: y - 1 },
            color: color.line,
        })
    }

    /* Section 3 */
    {
        y -= fieldHeight / 2
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page1.drawText('Section 3: Eligibility and Qualifications', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        /* Row 1 */
        {
            const { legalStatus } = application
            const statuses = Application.list.legalStatus
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('Immigration Status', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page1.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })

            vLineX += gap
            text = statuses[0]
            drawCheckBox(page1, marginX + vLineX, y - fieldHeight / 1.5, legalStatus[0] === 0)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + gap
            text = statuses[1]
            drawCheckBox(page1, marginX + vLineX, y - fieldHeight / 1.5, legalStatus[0] === 1)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + gap
            text = statuses[2]
            drawCheckBox(page1, marginX + vLineX, y - fieldHeight / 1.5, legalStatus[0] === 2)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + gap
            page1.drawText('Expiration Date', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(legalStatus[1] ? moment(legalStatus[1]).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 2 */
        {
            const { commercial, state, number, class: dlClass, issuedOn, expiresOn, endorsement, restriction } = application.dl
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight * 2 },
                    color: color.line,
                })
            page1.drawText("Driver's License", {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page1.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight * 2 },
                color: color.line,
            })
            vLineX += gap
            text = 'Commercial'
            drawCheckBox(page1, marginX + vLineX, y - fieldHeight / 1.5, commercial)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + gap
            page1.drawText('State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(state || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 40
            page1.drawText('License #', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(number || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 99
            page1.drawText('Class', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(dlClass || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 45
            page1.drawText('Issued on', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(issuedOn ? moment(issuedOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 72
            page1.drawText('Expires on', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(expiresOn ? moment(expiresOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight * 2 },
                    color: color.line,
                })
            vLineX = (width - marginX * 2) / 5
            page1.drawText('Endorsements', {
                x: marginX + vLineX + gap, y: y - offset.labelY - fieldHeight,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(endorsement || '', {
                x: marginX + vLineX + gap, y: y - offset.valueY - fieldHeight,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += ((width - marginX * 2) - vLineX) / 2
            page1.drawText('Restrictions', {
                x: marginX + vLineX + gap, y: y - offset.labelY - fieldHeight,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(restriction || '', {
                x: marginX + vLineX + gap, y: y - offset.valueY - fieldHeight,
                font: font.value, size: size.value, color: color.value,
            })
            y -= fieldHeight * 2
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 3 */
        {
            const { expiresOn, issuedOn, nrcme } = application.mec || {}
            if (outsideBorder)
                page1.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page1.drawText('Medical Card', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page1.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })
            page1.drawText('NRCME #', {
                x: marginX + vLineX + gap, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(nrcme || '', {
                x: marginX + vLineX + gap, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 85
            page1.drawText('Exam Date', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(issuedOn ? moment(issuedOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 80
            page1.drawText('Expires on', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(expiresOn ? moment(expiresOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page1.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })

            y -= fieldHeight
            page1.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Questions */
        {
            const offsetX = 115
            const { denied, deniedExpl, revoked, revokedExpl } = application.dl
            const { underMeds, medList } = application
            let lineLength
            y -= fieldHeight / 1.7
            vLineX = padding
            page1.drawText('Have you ever been denied a license, permit, or privilege to operate a motor vehicle?', {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            vLineX += width - marginX - offsetX
            text = 'Yes'
            drawCheckBox(page1, marginX + vLineX, y, denied === true)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, denied === false)
            page1.drawText(text, {
                x: marginX + vLineX + 15 + 2, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            y -= fieldHeight / 2
            vLineX = padding
            text = 'If YES, provide details:'
            page1.drawText(text, {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += textWidth
            page1.drawText(deniedExpl || '', {
                x: marginX + vLineX + gap + padding, y: y + 2,
                font: font.value, size: size.value, color: color.value,
            })
            lineLength = width - marginX * 2 - vLineX - gap - padding
            page1.drawLine({
                start: { x: marginX + vLineX + gap, y: y - 1 },
                end: { x: marginX + vLineX + gap + lineLength, y: y - 1 },
                color: color.line,
            })
            y -= fieldHeight / 1.7
            vLineX = padding
            page1.drawText('Has your license, permit, or driving privilege ever been suspended or revoked?', {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            vLineX += width - marginX - offsetX
            text = 'Yes'
            drawCheckBox(page1, marginX + vLineX, y, revoked === true)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, revoked === false)
            page1.drawText(text, {
                x: marginX + vLineX + 15 + 2, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            y -= fieldHeight / 2
            vLineX = padding
            text = 'If YES, provide details:'
            page1.drawText(text, {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += textWidth
            page1.drawText(revokedExpl || '', {
                x: marginX + vLineX + gap + padding, y: y + 2,
                font: font.value, size: size.value, color: color.value,
            })
            lineLength = width - marginX * 2 - vLineX - gap - padding
            page1.drawLine({
                start: { x: marginX + vLineX + gap, y: y - 1 },
                end: { x: marginX + vLineX + gap + lineLength, y: y - 1 },
                color: color.line,
            })
            y -= fieldHeight / 1.7
            vLineX = padding
            page1.drawText('Are you currently taking any medication that may impair your ability to safely operate a commercial motor vehicle?', {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            vLineX += width - marginX - offsetX
            text = 'Yes'
            drawCheckBox(page1, marginX + vLineX, y, underMeds === true)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, underMeds === false)
            page1.drawText(text, {
                x: marginX + vLineX + 15 + 2, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            y -= fieldHeight / 2
            vLineX = padding
            text = 'If YES, list medications:'
            page1.drawText(text, {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += textWidth
            page1.drawText(medList || '', {
                x: marginX + vLineX + gap + padding, y: y + 2,
                font: font.value, size: size.value, color: color.value,
            })
            lineLength = width - marginX * 2 - vLineX - gap - padding
            page1.drawLine({
                start: { x: marginX + vLineX + gap, y: y - 1 },
                end: { x: marginX + vLineX + gap + lineLength, y: y - 1 },
                color: color.line,
            })
        }

    }

    /* Section 4 */
    {
        const offsetX = 115
        const { dui, duiInDecade, criminal, criminalExpl, dotDat } = application
        let lineLength
        y -= fieldHeight / 2
        page1.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page1.drawText('Section 4: Legal Compliance', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })
        y -= fieldHeight / 1.7
        vLineX = padding
        page1.drawText('Have you ever been arrested in connection with impaired or intoxicated driving (DUI/DWI)?', {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        vLineX += width - marginX - offsetX
        text = 'Yes'
        drawCheckBox(page1, marginX + vLineX, y, dui === true)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, dui === false)
        page1.drawText(text, {
            x: marginX + vLineX + 15 + 2, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        y -= fieldHeight / 2
        vLineX = padding
        text = 'If YES, when did the DUI/DWI occur?'
        page1.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth + gap
        drawCheckBox(page1, marginX + vLineX + 2, y, dui && duiInDecade)
        text = 'Within the past 10 years'
        page1.drawText(text, {
            x: marginX + vLineX + 15 + 2, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth + gap + 15 + 2
        drawCheckBox(page1, marginX + vLineX + 2, y, dui && !duiInDecade)
        text = 'More than 10 years ago'
        page1.drawText(text, {
            x: marginX + vLineX + 15 + 2, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        y -= fieldHeight / 1.7
        vLineX = padding
        page1.drawText('Have you ever been charged with or found guilty of a misdemeanor or felony offense?', {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        vLineX += width - marginX - offsetX
        text = 'Yes'
        drawCheckBox(page1, marginX + vLineX, y, criminal === true)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, criminal === false)
        page1.drawText(text, {
            x: marginX + vLineX + 15 + 2, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        y -= fieldHeight / 2
        vLineX = padding
        text = 'If YES, provide details:'
        page1.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth
        page1.drawText(criminalExpl || '', {
            x: marginX + vLineX + gap + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        lineLength = width - marginX * 2 - vLineX - gap - padding
        page1.drawLine({
            start: { x: marginX + vLineX + gap, y: y - 1 },
            end: { x: marginX + vLineX + gap + lineLength, y: y - 1 },
            color: color.line,
        })
        y -= fieldHeight / 1.7
        vLineX = padding
        page1.drawText('Within the past 5 years, have you ever failed or refused to take a DOT-required drug or alcohol test', {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        y -= fieldHeight / 2.5
        page1.drawText('for pre-employment, random testing, or post-accident purposes?', {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        vLineX += width - marginX - offsetX
        text = 'Yes'
        drawCheckBox(page1, marginX + vLineX, y, dotDat === true)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, dotDat === false)
        page1.drawText(text, {
            x: marginX + vLineX + 15 + 2, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
    }


    /* PAGE 2 */
    const page2 = pdfDoc.addPage([width, height])
    text = `Page 2 of ${totalPages}`
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page2.drawText(text, {
        x: width - marginX - textWidth, y: marginY,
        font: font.label, size: size.label / 1.2, color: color.label,
    })
    y = height - marginY

    /* Section 5 */
    {
        violations = sortArrayByObjectKey(violations, 'citedOn', false)
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page2.drawText('Section 5: Citations for the past three years', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        for (let i = 0; i < 5; i++) {
            const citation = violations[i]
            let violation, other, citedOn, state
            if (citation) ({ violation, other, citedOn, state } = citation)

            if (violation) {
                if (violation !== 'other')
                    violationLoop:
                    for (const group in Application.list.violation) {
                        const set = Application.list.violation[group]

                        if (typeof set === 'object')
                            for (const prop in set) {
                                if (violation !== prop) continue

                                violation = set[prop]
                                break violationLoop
                            }
                    }
            }
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            text = `Violation #${i + 1}`
            page2.drawText(text, {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            page2.drawText('(Description)', {
                x: marginX + padding + textWidth + 2, y: y - offset.labelY,
                font: font.label, size: size.label * .75, color: color.label,
            })
            page2.drawText(other || violation || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3
            page2.drawText('Citation Date', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(citedOn ? moment(citedOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 85
            page2.drawText('Citation State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(state || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })

            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }
    }

    /* Section 6 */
    {
        accidents = sortArrayByObjectKey(accidents, 'citedOn', false)
        y -= fieldHeight / 2
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page2.drawText('Section 6: Accidents for the past three years', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })
        for (let i = 0; i < 5; i++) {
            const accident = accidents[i]
            let collision, other, date, state, injuries, fatalities
            if (accident) ({ collision, other, date, state, injuries, fatalities } = accident)

            if (collision) {
                if (collision !== 'other')
                    collisionLoop:
                    for (const group in Application.list.collision) {
                        const set = Application.list.collision[group]

                        if (typeof set === 'object')
                            for (const prop in set) {
                                if (collision !== prop) continue

                                collision = set[prop]
                                break collisionLoop
                            }
                    }
                injuries = injuries ? 'Yes' : 'No'
                fatalities = fatalities ? 'Yes' : 'No'
            }
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            text = `Accident #${i + 1}`
            page2.drawText(text, {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            page2.drawText('(Description)', {
                x: marginX + padding + textWidth + 2, y: y - offset.labelY,
                font: font.label, size: size.label * .75, color: color.label,
            })
            page2.drawText(other || collision || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3
            page2.drawText('Date', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(date ? moment(date).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 85
            page2.drawText('State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(state || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 75
            text = 'Injuries'
            page2.drawText(text, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            page2.drawText('(Y/N)', {
                x: marginX + vLineX + padding + textWidth + 2, y: y - offset.labelY,
                font: font.label, size: size.label * .7, color: color.label,
            })
            page2.drawText(injuries || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 75
            text = 'Fatalities'
            page2.drawText(text, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            page2.drawText('(Y/N)', {
                x: marginX + vLineX + padding + textWidth + 2, y: y - offset.labelY,
                font: font.label, size: size.label * .7, color: color.label,
            })
            page2.drawText(fatalities || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })

            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }
    }

    /* Section 7 */
    {
        const { experience } = application
        y -= fieldHeight / 2
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page2.drawText('Section 7: Driving Experience', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })
        y -= fieldHeight / 1.7
        drawCheckBox(page2, marginX + padding, y, experience?.cmv === true)
        page2.drawText('Previously operated a Commercial Motor Vehicle (CMV)', {
            x: marginX + padding + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        /* Row 1 */
        {
            const { semi } = Application.list.vehicle
            let { vehicles } = experience
            if (!vehicles?.semi) vehicles = { semi: [] }
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page2.drawText('Semi Tractor/Trailer', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page2.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })
            for (const vhl in semi) {
                vLineX += gap
                text = semi[vhl]
                drawCheckBox(page2, marginX + vLineX, y - fieldHeight / 1.5, vehicles.semi.includes(vhl))
                page2.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }
            
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 2 */
        {
            const { straight } = Application.list.vehicle
            let { vehicles } = experience
            if (!vehicles?.straight) vehicles = { straight: [] }
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page2.drawText('Straight Truck', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page2.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })
            for (const vhl in straight) {
                vLineX += gap
                text = straight[vhl] + ' Truck'
                drawCheckBox(page2, marginX + vLineX, y - fieldHeight / 1.5, vehicles.straight.includes(vhl))
                page2.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }
            
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 3 */
        {
            const misc = { van: 'Cargo Van', tandem: 'Tandem Semi Tractor/Trailer' }
            let { vehicles } = experience
            if (!vehicles?.misc) vehicles = { misc: [] }
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page2.drawText('Other', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page2.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })
            for (const vhl in misc) {
                vLineX += gap
                text = misc[vhl]
                drawCheckBox(page2, marginX + vLineX, y - fieldHeight / 1.5, vehicles.misc.includes(vhl))
                page2.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }
            
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        /* Row 4 */
        {
            const { firstDate, lastDate, mileage, hours } = experience
            let totalHours = 0
            if (hours) hours.forEach(hr => totalHours += hr)
            if (totalHours) totalHours = totalHours + ''
            if (outsideBorder)
                page2.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page2.drawText('OTR Experience', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 5
            page2.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })

            page2.drawText('First Driven on', {
                x: marginX + vLineX + gap, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(firstDate ? moment(firstDate).format(dateFormat) : '', {
                x: marginX + vLineX + gap, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 80
            page2.drawText('Last Driven on', {
                x: marginX + vLineX + gap, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(lastDate ? moment(lastDate).format(dateFormat) : '', {
                x: marginX + vLineX + gap, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 80
            page2.drawText('Total Mileage', {
                x: marginX + vLineX + gap, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(mileage ? mileage.toLocaleString('en-US') : '', {
                x: marginX + vLineX + gap, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 70
            page2.drawText('Hours driven in the last 7 days', {
                x: marginX + vLineX + gap, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(totalHours || '', {
                x: marginX + vLineX + gap, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            
            if (outsideBorder)
                page2.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

    }

    /* Section 8 */
    {
        let { experience } = application
        if (!experience) experience = {}
        const { schName, schPhone, schState, schEndDate, schDuration } = experience
        y -= fieldHeight / 2
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page2.drawText('Section 8: CDL Training School', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        if (outsideBorder)
            page2.drawLine({
                start: { x: marginX, y },
                end: { x: marginX, y: y - fieldHeight },
                color: color.line,
            })
        page2.drawText('School Name', {
            x: marginX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(schName || '', {
            x: marginX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / 3.2
        page2.drawText('Phone', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(schPhone ? formatTel(schPhone) : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX += 110
        page2.drawText('State', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(schState || '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX += 50
        page2.drawText('Graduation Date', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(schEndDate ? moment(schEndDate).format(dateFormat) : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX += 90
        page2.drawText('Attendance Duration', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page2.drawText(schDuration ? Application.list.schoolDuration[schDuration]: '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        if (outsideBorder)
            page2.drawLine({
                start: { x: width - marginX, y },
                end: { x: width - marginX, y: y - fieldHeight },
                color: color.line,
            })
        y -= fieldHeight
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })
    }


    /* PAGE 3-4 */

    const emplPages = { page3: null, page4: null }

    /* Section 9 */
    {
        employers = sortArrayByObjectKey(employers, 'startedOn', false)

        for (let i = 0; i < 12; i++) {
            const page = i < 6 ? 'page3' : 'page4'
            const pageN = i < 6 ? 3 : 4
            if (!i || i === 6) {
                emplPages[page] = pdfDoc.addPage([width, height])
                text = `Page ${pageN} of ${totalPages}`
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                emplPages[page].drawText(text, {
                    x: width - marginX - textWidth, y: marginY,
                    font: font.label, size: size.label / 1.2, color: color.label,
                })
                y = height - marginY
                emplPages[page].drawLine({
                    start: { x: marginX, y },
                    end: { x: width - marginX, y },
                    thickness: 2, color: color.line,
                })
                y -= 14
                text = 'Section 9: Previous Employments'
                emplPages[page].drawText(text, {
                    x: marginX + padding, y,
                    font: font.section, size: size.section, color: color.section,
                })
                textWidth = font.section.widthOfTextAtSize(text, size.section)
                text = '(All jobs from the past 3 years and commercial experience from the past 10 years)'
                emplPages[page].drawText(text, {
                    x: marginX + textWidth + gap, y,
                    font: font.label, size: size.label, color: color.label,
                })

                y -= gap
                emplPages[page].drawLine({
                    start: { x: marginX, y },
                    end: { x: width - marginX, y },
                    color: color.line,
                })
            }
            const prevEmployer = employers[i]
            let employer, phone, address1, address2, city, state, zip,
                startedOn, position, earnings, fmcsr, dotDat, leftOn, rfl
            if (prevEmployer) (
                {
                    employer, phone, address1, address2, city, state, zip,
                    startedOn, position, earnings, fmcsr, dotDat, leftOn, rfl,
                } = prevEmployer
            )
            if (!i || i % 2 === 0) vLineX = marginX
            else vLineX = (width - marginX * 2) / 2 + marginX
            if (outsideBorder)
                emplPages[page].drawLine({
                    start: { x: vLineX, y },
                    end: { x: vLineX, y: y - fieldHeight * 7 + 5 },
                    color: color.line,
                })

            y -= 1
            emplPages[page].drawText(`Employer #${i + 1}`, {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(employer || '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 150
            emplPages[page].drawText('Phone', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(phone ? formatTel(phone) : '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX -= 150
            y -= fieldHeight
            y += 1
            emplPages[page].drawText('Street Address', {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(address1 || '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 150
            emplPages[page].drawText('Suite/Unit #', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(address2 || '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX -= 150
            y -= fieldHeight
            y += 1
            emplPages[page].drawText('City', {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(city || '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 150
            emplPages[page].drawText('State', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(state || '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 45
            emplPages[page].drawText('Zip', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(zip || '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX -= 195
            y -= fieldHeight
            y += 1
            emplPages[page].drawText('Position', {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(position || '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 150
            emplPages[page].drawText('Monthly Earnings/Salary', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(earnings ? '$' + earnings.toLocaleString('en-US') : '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX -= 150
            y -= fieldHeight
            y += 1
            emplPages[page].drawText('Employment Date', {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(startedOn ? moment(startedOn).format(dateFormat) : '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 150
            emplPages[page].drawText('Termination Date', {
                x: vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(employer ? leftOn ? moment(leftOn).format(dateFormat) : 'Still Employed' : '', {
                x: vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX -= 150
            y -= fieldHeight
            y += 1
            emplPages[page].drawText('Reason for Leaving', {
                x: vLineX + padding * 2, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            emplPages[page].drawText(rfl || '', {
                x: vLineX + padding * 2, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX 
            y -= fieldHeight
            y += 1
            drawCheckBox(emplPages[page], vLineX + padding * 2, y - offset.labelY - 2, fmcsr)
            emplPages[page].drawText("Subject to FMCSR's?", {
                x: vLineX + padding * 2 + 15, y: y - offset.labelY,
                font: font.label, size: size.label * .9, color: color.label,
            })
            drawCheckBox(emplPages[page], vLineX + padding * 2, y - offset.labelY - 2 - 13, dotDat)
            emplPages[page].drawText('Subject to drug/alcohol testing requirements per 49 CFR Part 40', {
                x: vLineX + padding * 2 + 15, y: y - offset.labelY - 13,
                font: font.label, size: size.label * .9, color: color.label,
            })
            // emplPages[page].drawText('Subject to:', {
            //     x: vLineX + padding * 2, y: y - offset.labelY,
            //     font: font.label, size: size.label, color: color.label,
            // })
            // vLineX += 75
            // emplPages[page].drawText('FMCSR', {
            //     x: vLineX + padding * 2, y: y - offset.labelY,
            //     font: font.label, size: size.label, color: color.label,
            // })
            // emplPages[page].drawText(fmcsr || '', {
            //     x: vLineX + padding * 2, y: y - offset.valueY,
            //     font: font.value, size: size.value, color: color.value,
            // })
            // vLineX += 65
            // emplPages[page].drawText('DOT Drug/Alcohol Testing', {
            //     x: vLineX + padding, y: y - offset.labelY,
            //     font: font.label, size: size.label, color: color.label,
            // })
            // emplPages[page].drawText(dotDat || '', {
            //     x: vLineX + padding, y: y - offset.valueY,
            //     font: font.value, size: size.value, color: color.value,
            // })

            y += fieldHeight * 6
            y -= 5
            if (i % 2 !== 0) {
                if (outsideBorder)
                    emplPages[page].drawLine({
                        start: { x: width - marginX, y },
                        end: { x: width - marginX, y: y - fieldHeight * 7 + 5 },
                        color: color.line,
                    })

                y -= fieldHeight * 7 - 5
                emplPages[page].drawLine({
                    start: { x: marginX, y },
                    end: { x: width - marginX, y },
                    color: color.line,
                })
            }

        }
    }


    /* PAGE 5 */
    const page5 = pdfDoc.addPage([width, height])
    text = `Page 5 of ${totalPages}`
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page5.drawText(text, {
        x: width - marginX - textWidth, y: marginY,
        font: font.label, size: size.label / 1.2, color: color.label,
    })
    y = height - marginY

    /* Section 10 */
    {
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page5.drawText('Section 10: Employment and Driving Preferences', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        /* Row 1 */
        {
            const { position } = application
            const positions = Driver.list.position
            if (outsideBorder)
                page5.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page5.drawText('Position', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 4
            page5.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })

            for (const p in positions) {
                vLineX += gap
                text = positions[p]
                drawCheckBox(page5, marginX + vLineX, y - fieldHeight / 1.5, position === p)
                page5.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }

            if (outsideBorder)
                page5.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page5.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }
 
        /* Row 2 */
        {
            const haulRegions = Application.list.haulRegion
            let { haulRegion } = application.preference
            if (!haulRegion) haulRegion = []
            if (outsideBorder)
                page5.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page5.drawText('Haul Region', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 4
            page5.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })

            for (const region in haulRegions) {
                vLineX += gap
                text = haulRegions[region]
                drawCheckBox(page5, marginX + vLineX, y - fieldHeight / 1.5, haulRegion.includes(region))
                page5.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }

            if (outsideBorder)
                page5.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page5.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }
 
        /* Row 3 */
        {
            const semiList = Application.list.vehicle.semi
            const semiIdx = [0, 1, 2, 3]
            let { equipmentType } = application.preference
            if (!equipmentType) equipmentType = []
            if (outsideBorder)
                page5.drawLine({
                    start: { x: marginX, y },
                    end: { x: marginX, y: y - fieldHeight },
                    color: color.line,
                })
            page5.drawText('Equipment Type (Semi)', {
                x: marginX + padding, y: y - fieldHeight / 1.65,
                font: font.section, size: size.section, color: color.section,
            })
            vLineX = (width - marginX * 2) / 4
            page5.drawLine({
                start: { x: vLineX + marginX, y },
                end: { x: vLineX + marginX, y: y - fieldHeight },
                color: color.line,
            })

            let i = 0
            for (const type in semiList) {
                if (!semiIdx.includes(i++)) continue

                vLineX += gap
                text = semiList[type]
                drawCheckBox(page5, marginX + vLineX, y - fieldHeight / 1.5, equipmentType.includes(type))
                page5.drawText(text, {
                    x: marginX + vLineX + 15, y: y - fieldHeight / 1.65,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }
            
            if (outsideBorder)
                page5.drawLine({
                    start: { x: width - marginX, y },
                    end: { x: width - marginX, y: y - fieldHeight },
                    color: color.line,
                })
            y -= fieldHeight
            page5.drawLine({
                start: { x: marginX, y },
                end: { x: width - marginX, y },
                color: color.line,
            })
        }

        {
            const { operType, teamName, teamPhone } = application.preference
            y -= fieldHeight / 1.6
            drawCheckBox(page5, marginX + padding, y, operType === 's')
            text = 'Solo'
            page5.drawText(text, {
                x: marginX + padding + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX = padding + textWidth + 15 + gap * .8
            drawCheckBox(page5, marginX + vLineX, y, operType === 't')
            text = 'Team'
            page5.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += padding + textWidth + 15 + gap * .8
            text = "Partner's Full Name:"
            page5.drawText(text, {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += padding + textWidth
            page5.drawText(teamName || '', {
                x: marginX + vLineX + padding, y: y + 2,
                font: font.value, size: size.value, color: color.value,
            })
            page5.drawLine({
                start: { x: marginX + vLineX, y: y - 1 },
                end: { x: marginX + vLineX + 170, y: y - 1 },
                color: color.line,
            })
            vLineX += padding + 170 + gap * .8
            text = "Partner's Phone:"
            page5.drawText(text, {
                x: marginX + vLineX, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += padding + textWidth
            page5.drawText(teamPhone ? formatTel(teamPhone) : '', {
                x: marginX + vLineX + padding, y: y + 2,
                font: font.value, size: size.value, color: color.value,
            })
            page5.drawLine({
                start: { x: marginX + vLineX, y: y - 1 },
                end: { x: marginX + vLineX + 95, y: y - 1 },
                color: color.line,
            })
        }

        {
            const startPrefs = Application.list.startPref
            const { startPref } = application.preference
            y -= fieldHeight / 1.6
            text = 'When would you prefer to start?'
            page5.drawText(text, {
                x: marginX + padding, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX = padding + textWidth + gap

            for (const sp in startPrefs) {
                vLineX += gap
                text = startPrefs[sp]
                drawCheckBox(page5, marginX + vLineX, y, startPref === sp)
                page5.drawText(text, {
                    x: marginX + vLineX + 15, y: y + 1,
                    font: font.label, size: size.label, color: color.label,
                })
                textWidth = font.label.widthOfTextAtSize(text, size.label)
                vLineX += 15 + textWidth
            }
        }

    }

    /* Section 11 */
    //! If EXPEDITE should have other types, will need to combine
    {
        const vhlTypes = Application.list.vhlType.truckLoad
        let mmt, type, make, model, year, length
        if (application.vehicle) ({ mmt, type, make, model, year, length } = application.vehicle)
        if (mmt && mmt !== 'other') [ type, make, model ] = mmt.split(':')
        if (year) year = year + ''
        if (length) length = `${length} ft`

        y -= fieldHeight / 2
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        text = 'Section 11: Personal Motor Vehicle'
        page5.drawText(text, {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })
        textWidth = font.section.widthOfTextAtSize(text, size.section)
        text = '(Owner-Operators only)'
        page5.drawText(text, {
            x: marginX + textWidth + gap + 1, y,
            font: font.label, size: size.label, color: color.label,
        })

        y -= fieldHeight / 1.7
        vLineX = padding
        text = 'Vehicle Type:'
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth

        for (const vt in vhlTypes) {
            vLineX += gap
            text = vhlTypes[vt]
            drawCheckBox(page5, marginX + vLineX, y, type === vt)
            page5.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth
        }

        y -= fieldHeight / 1.7
        text = 'Make:'
        page5.drawText(text, {
            x: marginX + padding, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX = textWidth + padding
        page5.drawText(make || '', {
            x: marginX + vLineX + padding * 2, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX + padding, y: y - 1 },
            end: { x: marginX + vLineX + padding + 90, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 90 + gap
        text = 'Model:'
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth
        page5.drawText(model || '', {
            x: marginX + vLineX + padding * 2, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX + padding, y: y - 1 },
            end: { x: marginX + vLineX + padding + 120, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 120 + gap
        text = 'Year:'
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth
        page5.drawText(year || '', {
            x: marginX + vLineX + padding * 2, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX + padding, y: y - 1 },
            end: { x: marginX + vLineX + padding + 50, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 50 + gap
        text = 'Length:'
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += textWidth
        page5.drawText(length || '', {
            x: marginX + vLineX + padding * 2, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX + padding, y: y - 1 },
            end: { x: marginX + vLineX + padding + 80, y: y - 1 },
            color: color.line,
        })
    }

    /* Section 12 */
    {
        const { activeBusiness } = application
        const { busName, state, ein } = application.business || {}
        y -= fieldHeight / 2
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page5.drawText('Section 12: Limited Liability Company', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })
        // y -= fieldHeight / 1.7
        // drawCheckBox(page5, marginX + padding, y, activeBusiness)
        // page5.drawText('Currently operating an active LLC', {
        //     x: marginX + padding + 15, y: y + 1,
        //     font: font.label, size: size.label, color: color.label,
        // })
        vLineX = padding
        y -= fieldHeight / 1.7
        text = "Business Name:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(busName ? `${busName}, LLC` : '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 220, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 220 + gap * .8
        text = "State:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(state || '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 50, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 50 + gap * .8
        text = "EIN:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(ein ? formatEin(ein) : '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 90, y: y - 1 },
            color: color.line,
        })
    }

    /* Section 13 */
    {
        const person = application?.beneficiary?.lastName ? new Person(application.beneficiary) : {}
        const { relation, otherRel, ssn, phone } = application.beneficiary
        y -= fieldHeight / 2
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page5.drawText('Section 13: Occupational Accident Insurance (Beneficiary Information)', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })

        y -= gap
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })
        if (outsideBorder)
            page5.drawLine({
                start: { x: marginX, y },
                end: { x: marginX, y: y - fieldHeight },
                color: color.line,
            })
        page5.drawText('Full Name', {
            x: marginX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page5.drawText(person.lastName ? person.fullName('FMLs') : '', {
            x: marginX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX = (width - marginX * 2) / 2.4
        page5.drawText('Relationship', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page5.drawText(otherRel || relation || '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX += 110
        page5.drawText('Phone', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page5.drawText(phone ? formatTel(phone) : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        vLineX += 100
        page5.drawText('SSN', {
            x: marginX + vLineX + padding, y: y - offset.labelY,
            font: font.label, size: size.label, color: color.label,
        })
        page5.drawText(ssn ? formatSsn(ssn) : '', {
            x: marginX + vLineX + padding, y: y - offset.valueY,
            font: font.value, size: size.value, color: color.value,
        })
        if (outsideBorder)
            page5.drawLine({
                start: { x: width - marginX, y },
                end: { x: width - marginX, y: y - fieldHeight },
                color: color.line,
            })
        y -= fieldHeight
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })
    }

    /* Section 14 */
    {
        const { name, phone, relation } = application.emergency
        y -= fieldHeight / 2
        page5.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            thickness: 2, color: color.line,
        })
        y -= 14
        page5.drawText('Section 14: Emergency Contact', {
            x: marginX + padding, y,
            font: font.section, size: size.section, color: color.section,
        })
        vLineX = padding
        y -= fieldHeight / 1.7
        text = "Name:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(name || '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 150, y: y - 1 },
            color: color.line,
        })
        
        vLineX += padding + 150 + gap * .8
        text = "Phone:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(phone ? formatTel(phone) : '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 100, y: y - 1 },
            color: color.line,
        })
        vLineX += padding + 100 + gap * .8
        text = "Relationship:"
        page5.drawText(text, {
            x: marginX + vLineX, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += padding + textWidth
        page5.drawText(relation || '', {
            x: marginX + vLineX + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page5.drawLine({
            start: { x: marginX + vLineX, y: y - 1 },
            end: { x: marginX + vLineX + 100, y: y - 1 },
            color: color.line,
        })
    }

    y -= fieldHeight
    page5.drawText('Acknowledgment and Authorization', {
        x: marginX + padding, y,
        font: font.section, size: size.section, color: color.section,
    })

    y -= fieldHeight / 2
    text = 'I certify that all information provided in this application is true and complete to the best of my knowledge.'
    lines = wrapText(text, font.label, size.label)
    lines.forEach(line => {
        page5.drawText(line, {
            x: marginX + padding, y,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap * 1.2
    })
    y -= gap / 1.8
    text = 'I authorize the employer to verify all statements made in this application, including but not limited to employment history, references, '
    text += 'and personal records such as Motor Vehicle Reports (MVRs), Safety Performance History, and other records required under DOT or FMCSA regulations.'
    lines = wrapText(text, font.label, size.label)
    lines.forEach(line => {
        page5.drawText(line, {
            x: marginX + padding, y,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap * 1.2
    })
    y -= gap / 1.8
    text = 'I understand and acknowledge that, unless otherwise defined by applicable law, employment with this organization is "at-will", '
    text += 'meaning I may resign at any time, and the company may terminate my employment at any time, with or without cause or notice. '
    text += 'I further understand that no supervisor, recruiter, or manager has authority to alter this employment relationship '
    text += 'except through a written agreement signed by an authorized company executive.'
    lines = wrapText(text, font.label, size.label)
    lines.forEach(line => {
        page5.drawText(line, {
            x: marginX + padding, y,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap * 1.2
    })
    y -= gap / 1.8
    text = 'If employed, I agree to comply with all company policies, safety protocols, and DOT/FMCSA regulations. '
    text += 'I understand that any false, misleading, or incomplete information provided during the application or '
    text += 'interview process may result in disqualification or immediate termination of employment.'
    lines = wrapText(text, font.label, size.label)
    lines.forEach(line => {
        page5.drawText(line, {
            x: marginX + padding, y,
            font: font.label, size: size.label, color: color.label,
        })
        y -= gap * 1.2
    })

    vLineX = padding
    y -= fieldHeight * 1.2
    text = "Applicant's Signature:"
    page5.drawText(text, {
        x: marginX + vLineX, y: y + 1,
        font: font.label, size: size.label, color: color.label,
    })
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    vLineX += padding + textWidth
    page5.drawText(signature, {
        x: marginX + vLineX + padding, y: y + 2,
        font: font.signature, size: size.signature, color: color.signature,
    })
    page5.drawLine({
        start: { x: marginX + vLineX, y: y - 1 },
        end: { x: marginX + vLineX + 250, y: y - 1 },
        color: color.line,
    })
    vLineX += 250 + gap
    text = 'Application Date'
    page5.drawText(text, {
        x: marginX + vLineX, y: y + 1,
        font: font.label, size: size.label, color: color.label,
    })
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    vLineX += padding + textWidth
    page5.drawText(application.finishedAt ? moment(application.finishedAt).format(dateFormat) : '', {
        x: marginX + vLineX + padding, y: y + 2,
        font: font.value, size: size.value, color: color.value,
    })
    page5.drawLine({
        start: { x: marginX + vLineX, y: y - 1 },
        end: { x: marginX + vLineX + 100, y: y - 1 },
        color: color.line,
    })


    return await pdfDoc.save()
}