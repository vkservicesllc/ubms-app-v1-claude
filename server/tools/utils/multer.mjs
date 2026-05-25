let { DIR__PATH: dir } = Bun.env
dir += '/uploads'

const multer = require('multer')
const fs = require('fs')
const path = require('path')


export default subdir => multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let dest = path.join(dir, subdir) // `${dir + subdir}/`
            if (req?.upload?.id) dest = dest.replace('{id}', req.upload.id)
            if (req?.upload?.id2) dest = dest.replace('{id2}', req.upload.id2)

            fs.mkdirSync(dest, { recursive: true })
            cb(null, dest)
        },
        filename: (req, file, cb) => {
            let name = file.originalname
            const ext = path.extname(file.originalname)
            const config = req?.upload?.files?.[file.fieldname]

            if (config?.filename)
                name = config.filename + ext
            else if (req?.upload?.filename) 
                name = req.upload.filename + ext

            cb(null, name)
        },
    }),
})