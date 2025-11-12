module.exports = {

    auth: (res, errMsg, api = false) => {
        if (!errMsg) errMsg = 'Unauthorized: Authentication failed'
        const error = api ? { error: errMsg } : errMsg

        return res.status(401).send(error)
    },

    server: (res, errMsg, api = false) => {
        if (!errMsg) errMsg = 'Internal Server Error'
        const error = api ? { error: errMsg } : errMsg

        return res.status(500).send(error)
    },

}