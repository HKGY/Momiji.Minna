const particleContainer = document.querySelector('.particle-container');

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = Math.random() * 20 + 'px';
    particle.style.height = particle.style.width;
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.animationDuration = Math.random() * 3 + 2 + 's';
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    particle.addEventListener('animationiteration', () => {
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
    });

    particleContainer.appendChild(particle);
}

for (let i = 0; i < 30; i++) {
    createParticle();
}
