const scrollPoint = document.querySelector('[data-scroll-point="#"]')

if (scrollPoint)
    setTimeout(() => scrollPoint.scrollIntoView({ behavior: 'smooth', block: 'start' }), 750)