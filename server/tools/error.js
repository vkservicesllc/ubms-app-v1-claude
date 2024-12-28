module.exports = {

    api: {

        auth: function(response, message = null, array = false) {
            const data = array ? [] : {}

            return response.status(401).send({
                error: message || 'Not authorized',
                data,
            })
        },

        server: function(response, message = null, error, array = false) {
            console.error({ error })
            const data = array ? [] : {}
            if (message) error = message

            return response.status(500).send({ error, data })
        },

    },

    data: {

        auth: function(response, message = null) {
            if (!message) message = 'Not authorized'

            return response.status(401).send(message)
        },

        server: function(response, message = null, error) {
            console.error({ error })
            error = new Error(error)

            return response.status(500).send(message || 'Server internal error')
        },

    },

}