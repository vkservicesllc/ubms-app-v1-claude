const recognizeApi = require('./api')


module.exports = {

    auth: (req, res, message = 'Unauthorized: Authentication failed') => {
        res.status(401)

        if (recognizeApi(req)) return res.json({ message })

        return res.send(message)
    },

    server: (req, res, error) => {
        let message = error?.message ? `${error.name}: ${error.message}` : 'Server Internal Error'
        res.status(500)

        if (recognizeApi(req)) {
            let xhr = { message }

            if (res.session?.user?.status === 'D') {
                const { name, message, stack } = error
                xhr = { name, message, stack }
            }

            return res.json(xhr)
        } else {
            if (res.session?.user?.status === 'D')
                message = error.stack

            return res.send(message)
        }
    },

}