const scrollPoint = document.getElementById('scroll-point')
console.log(scrollPoint)

if (scrollPoint)
    setTimeout(() => scrollPoint.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500)