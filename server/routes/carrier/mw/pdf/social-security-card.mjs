let { DIR__PATH: dir } = Bun.env
dir += '/uploads/driver/'

import moment from 'moment'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfParams from '../../../../settings/pdf-lib.mjs'
import User from '../../../../tools/core/user.mjs'
import { getFiles } from '../../../../tools/utils/fs.mjs'
import { drawSide } from './components.mjs'


export default async (application, session) => {
    if (!application) return
    
    const { driverId, id } = application
    const title = `${application.fullName} - Social Security Card`
    const path = `${dir}/${driverId}/social-security-card/${id}`

    const files = await getFiles(path, false)
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    pdfDoc.setTitle(title)

    const { width, height, marginX, marginY } = pdfParams.letter
    const font = {
        title: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        subtitle: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        info: await pdfDoc.embedFont(StandardFonts.Helvetica),
        comment: await pdfDoc.embedFont(StandardFonts.Helvetica),
    }
    const size = {
        title: 15,
        subtitle: 13.2,
        info: 12,
        comment: 9,
    }

    const list = {}
    for (const file of files) {
        const [ since, dhs, uploadedBy, init ] = file.split('.')[0].split('_')

        const prop = since
        if (!list[prop]) list[prop] = {}
        list[prop].init = init === 'init'
        list[prop].since = moment(since).format('ll')
        list[prop].dhs = dhs === 'Y'
        list[prop].uploadedBy = (await User.fetch(session, { id: +uploadedBy })).fullName()
        list[prop].path = `${path}/${file}`
    }

    for (const key in list) {
        const item = list[key]
        const page = pdfDoc.addPage([width, height])
        let y = height - marginY * 1.5

        let text = `${application.fullName} – ${application.formId}`
        let textWidth = font.title.widthOfTextAtSize(text, size.title)
        page.drawText(text, {
            x: (width - textWidth) / 2, y,
            font: font.title, size: size.title,
        })

        if (application._carrierId) {
            y -= 20
            text = application.carrier.name
            textWidth = font.subtitle.widthOfTextAtSize(text, size.subtitle)
            page.drawText(text, {
                x: (width - textWidth) / 2, y,
                font: font.subtitle, size: size.subtitle,
            })
        }

        y -= 30
        text = `SOCIAL SECURITY CARD${item.init ? ' *' : ''}`
        if (item.dhs) text += ` – DHS Authorization Required`
        textWidth = font.info.widthOfTextAtSize(text, size.info)
        page.drawText(text, {
            x: (width - textWidth) / 2, y,
            font: font.info, size: size.info,
        })

        y -= marginY

        const slots = item.back ? 2 : 1
        const sectionGap = item.back ? 50 : 0
        const maxHeight = (y - marginY - sectionGap) / slots

        y = await drawSide(pdfDoc, page, item, y, maxHeight, .65)

        y -= marginY
        text = `Uploaded by: ${item.uploadedBy}`
        textWidth = font.comment.widthOfTextAtSize(text, size.comment)
        page.drawText(text, {
            x: (width - textWidth) / 2, y,
            font: font.comment, size: size.comment,
        })
    }

    return await pdfDoc.save()
}