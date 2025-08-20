require('dotenv').config({ path: '../../../.env' })
let { DIR__PATH: dir } = process.env
dir += '/uploads'

const multer = require('multer')
const fs = require('fs')
const path = require('path')


export default subdir => multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let path = `${dir + subdir}/`
            if (req?.upload?.dir) path += `${req.upload.dir}/`

            fs.mkdirSync(path, { recursive: true })
            cb(null, path)
        },
        filename: (req, file, cb) => {
            let name = file.originalname
            if (req?.upload?.filename) {
                const ext = path.extname(file.originalname)
                name = req.upload.filename + ext
            }

            cb(null, name)
        },
    }),
})