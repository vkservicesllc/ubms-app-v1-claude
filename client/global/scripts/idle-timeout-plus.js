jQuery(document).ready(() => {
    const path = '/api/session'

    $.ajax({
        url: `${path}/current`,
        type: 'POST',
        success(response) {
            const { error, maxAge, logoutUrl } = response
            if (error) {
                window.location.href = logoutUrl
                return
            }

            const warnTimeLimit = 30
            const idleTimeLimit = maxAge / 1000 - warnTimeLimit
            const keepAliveUrl = `${path}/keep-alive?_=${new Date().getTime()}`

            const keepAliveInterval = idleTimeLimit / 2

            IdleTimeoutPlus.start({
                logoutUrl,
                redirectUrl: logoutUrl,
                idleTimeLimit,

                keepAliveUrl,
                keepAliveInterval,

                warnTimeLimit,
                warnTitle: 'Inactivity Warning!',
                warnMessage: 'Your session is about to expire!',
                warnLogoutButton: 'Sign out',
            })
        },
    })

})