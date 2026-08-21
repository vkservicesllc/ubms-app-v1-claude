export const respond404 = (res) =>
    res.status(404).sendFile('404.html', {
        root: './server/views',
    });
