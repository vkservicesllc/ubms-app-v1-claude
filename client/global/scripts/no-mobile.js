$(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)

    if (mobile) {
        alert('Attention: Mobile devices are currently restricted!')
        window.location.href = $(`#${formSelectors.user.logoutLinkId}`).attr('href')
    }
})