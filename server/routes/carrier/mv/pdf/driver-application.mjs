import moment from 'moment'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import pdfParams from '../../../../settings/pdf-lib.mjs'
import { ssn as formatSsn, tel as formatTel } from '../../../../../client/global/modules/tools/utils/formatter.mjs'
import { Application } from '../../../../tools/core/driver.mjs'
import Person from '../../../../../client/global/modules/tools/core/person.mjs'
import Geography from '../../../../../client/global/modules/tools/core/geography.mjs'
import { sortArrayByObjectKey } from '../../../../../client/global/modules/tools/utils/sorter.mjs'


export default async (application, addresses, violations, accidents, employers) => {
    const pdfDoc = await PDFDocument.create()

    const { width, height, marginX, marginY } = pdfParams.letter
    let y = height - marginY, vLineX, vLineXOffsets, text, textWidth
    const fieldHeight = 33, gap = 9, padding = 5.7, dateFormat = 'MM/DD/YYYY', outsideBorder = true
    const font = {
        section: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        label: await pdfDoc.embedFont(StandardFonts.Helvetica),
        value: await pdfDoc.embedFont(StandardFonts.Helvetica),
    }
    const size = {
        section: 9.5,
        label: 8.9,
        value: 11.2,
    }
    const color = {
        line: rgb(0.2, 0.2, 0.2),
        section: rgb(0.1, 0.1, 0.1),
        label: rgb(0.2, 0.2, 0.2),
        value: rgb(0, 0, 0),
    }
    const offset = {
        labelY: 12,
        valueY: 27,
    }

    const drawCheckBox = (page, x, y, checked) => {
        page.drawRectangle({
            x, y, width: 10, height: 10,
            color: rgb(1, 1, 1),
            borderWidth: 1, borderColor: color.line,
        })

        if (checked) {
            page.drawLine({
                start: { x: x + 2, y: y + 5 },
                end: { x: x + 4, y: y + 1.5 },
                color: color.value,
            })
            page.drawLine({
                start: { x: x + 4, y: y + 1.5 },
                end: { x: x + 8, y: y + 8.5 },
                color: color.value,
            })
        }
    }

    const totalPages = 5


    /* PAGE 1 */
    const page1 = pdfDoc.addPage([width, height])
    text = `Page 1 of ${totalPages}`
    textWidth = font.label.widthOfTextAtSize(text, size.label)
    page1.drawText(text, {
        x: width - marginX - textWidth, y: marginY,
        font: font.label, size: size.label / 1.2, color: color.label,
    })

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
            page1.drawText(firstName, {
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
            page1.drawText(lastName + (suffix ? `, ${suffix}` : ''), {
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
            const { dob, gender, ssn, marital, phone } = application
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
            page1.drawText(moment(dob).format(dateFormat), {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3 * 2 / 4
            page1.drawText('Gender', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(gender[1], {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX - 18
            page1.drawText('SSN', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(formatSsn(ssn), {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += vLineX / 1.75
            page1.drawText('Marital Status', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(Person.maritalList[marital], {
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
            page1.drawText(formatTel(phone), {
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
            page1.drawText(address1, {
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
            page1.drawText(city, {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[2]
            page1.drawText('State', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(state[0], {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[3]
            page1.drawText('Zip', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(zip, {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / vLineXOffsets[4]
            page1.drawText('Living since', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(moment(addrSince).format(dateFormat), {
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
        page1.drawText(country ? Geography.countryList[country] : '', {
            x: marginX + padding + 15 + textWidth + gap * 1.4 + padding, y: y + 2,
            font: font.value, size: size.value, color: color.value,
        })
        page1.drawLine({
            start: { x: marginX + padding + 15 + textWidth + 15 + padding / 2, y: y - 1 },
            end: { x: marginX + padding + 15 + textWidth + 15 + padding / 2 + 150, y: y - 1 },
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
            const statuses = Application.legalStatusList
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
            page1.drawText(state, {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 40
            page1.drawText('License #', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(number, {
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
            page1.drawText(moment(issuedOn).format(dateFormat), {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 72
            page1.drawText('Expires on', {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page1.drawText(moment(expiresOn).format(dateFormat), {
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
            drawCheckBox(page1, marginX + vLineX, y, denied)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, !denied)
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
            drawCheckBox(page1, marginX + vLineX, y, revoked)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, !revoked)
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
            drawCheckBox(page1, marginX + vLineX, y, underMeds)
            page1.drawText(text, {
                x: marginX + vLineX + 15, y: y + 1,
                font: font.label, size: size.label, color: color.label,
            })
            textWidth = font.label.widthOfTextAtSize(text, size.label)
            vLineX += 15 + textWidth + padding
            text = 'No'
            drawCheckBox(page1, marginX + vLineX + 2, y, !underMeds)
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
        drawCheckBox(page1, marginX + vLineX, y, dui)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, !dui)
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
        drawCheckBox(page1, marginX + vLineX, y, criminal)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, !criminal)
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
        drawCheckBox(page1, marginX + vLineX, y, dotDat)
        page1.drawText(text, {
            x: marginX + vLineX + 15, y: y + 1,
            font: font.label, size: size.label, color: color.label,
        })
        textWidth = font.label.widthOfTextAtSize(text, size.label)
        vLineX += 15 + textWidth + padding
        text = 'No'
        drawCheckBox(page1, marginX + vLineX + 2, y, !dotDat)
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
                    for (const group in Application.violationList) {
                        const set = Application.violationList[group]

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
            page2.drawText(`Violation #${i + 1} (Description)`, {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(other || violation || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3
            page2.drawText(`Citation Date`, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(citedOn ? moment(citedOn).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 85
            page2.drawText(`Citation State`, {
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
                    for (const group in Application.accidentList) {
                        const set = Application.accidentList[group]

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
            page2.drawText(`Accident #${i + 1} (Description)`, {
                x: marginX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(other || collision || '', {
                x: marginX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX = (width - marginX * 2) / 3
            page2.drawText(`Date`, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(date ? moment(date).format(dateFormat) : '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 85
            page2.drawText(`State`, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(state || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 75
            page2.drawText(`Inuries`, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
            })
            page2.drawText(injuries || '', {
                x: marginX + vLineX + padding, y: y - offset.valueY,
                font: font.value, size: size.value, color: color.value,
            })
            vLineX += 75
            page2.drawText(`Fatalities`, {
                x: marginX + vLineX + padding, y: y - offset.labelY,
                font: font.label, size: size.label, color: color.label,
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
console.log(application.experience)
        y -= gap
        page2.drawLine({
            start: { x: marginX, y },
            end: { x: width - marginX, y },
            color: color.line,
        })

        /* Row 1 */
        {
            const { semi } = Application.vehicleList
            let { vehicles } = experience
            if (!vehicles) vehicles = { semi: [] }
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
            const { straight } = Application.vehicleList
            let { vehicles } = experience
            if (!vehicles) vehicles = { straight: [] }
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
            if (!vehicles) vehicles = { misc: [] }
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
    }


    return await pdfDoc.save()
}