$.ajax('/api/local-session/current', {
    method: 'POST',
    success(response) {
        setInterval(() => {
            $.ajax('/api/session/keep-alive', { cache: false });
        }, response.maxAge - 5000);
    },
    error(jqXHR) {
        if (jqXHR.status === 401) alert('Failed to keep permanent session!');
        location.reload();
    },
});
