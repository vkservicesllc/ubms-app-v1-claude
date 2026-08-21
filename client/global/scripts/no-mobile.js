$(() => {
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );

  if (mobile) {
    $.ajax('/api/session/current', {
      method: 'POST',
      success(response) {
        alert('Attention: Mobile devices are currently restricted!');
        window.location.href = response.logoutUrl;
      },
    });
  }
});
