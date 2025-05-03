$.ajax('/api/session/current', {
    method: 'POST',
    success(response) {
        const { maxAge } = response
        console.log(maxAge)
    },
})