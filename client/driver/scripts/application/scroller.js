const scrollPoint = document.querySelector('[data-scroll-point="#"]')
const scrollDuration = 750

if (scrollPoint)
    setTimeout(() => scrollPoint.scrollIntoView({ behavior: 'smooth', block: 'start' }), scrollDuration)