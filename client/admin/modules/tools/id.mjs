export default function() {
    const { href } = window.location
    const x = href.split('/')

    return x[x.length - 1]
}