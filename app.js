const galaxy = document.getElementById('galaxy');
const stars = [];

function addStar() {
    const input = document.getElementById('taskInput');
    if (!input.value) return;

    const starData = {
        name: input.value,
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        z: -1500, 
        el: document.createElement('div')
    };

    starData.el.className = 'star';
    starData.el.innerHTML = `<span>${starData.name}</span>`;
    galaxy.appendChild(starData.el);
    
    stars.push(starData);
    input.value = '';
    render();
}

function render() {
    const lineContainer = document.getElementById('lines');
    let svgContent = "";
    const focalLength = 800;

    stars.forEach((star, index) => {
        const scale = focalLength / (focalLength + Math.abs(star.z));
        const x2d = star.x * scale + (window.innerWidth / 2);
        const y2d = star.y * scale + (window.innerHeight / 2);

        star.el.style.transform = `translate3d(${x2d}px, ${y2d}px, 0) scale(${scale})`;
        star.el.style.opacity = scale;
        //  hides labels if they too far away 
        star.el.style.fontSize = scale > 0.5 ? "12px" : "0px";

        if (index > 0) {
            const prev = stars[index - 1];
            const pScale = focalLength / (focalLength + Math.abs(prev.z));
            const px2d = prev.x * pScale + (window.innerWidth / 2);
            const py2d = prev.y * pScale + (window.innerHeight / 2);

            if (star.z < 0 && prev.z < 0) {
                svgContent += `
                    <line x1="${x2d}" y1="${y2d}" x2="${px2d}" y2="${py2d}" 
                          class="neural-line"
                          stroke="rgba(0, 255, 255, ${scale * 0.3})" 
                          stroke-width="${1.5 * scale}" />
                `;
            }
        }
    });
    lineContainer.innerHTML = svgContent;
}


window.addEventListener('wheel', (e) => {
    e.preventDefault();
    stars.forEach(star => {
        star.z += e.deltaY * 0.8; 
        if (star.z > 500) star.z = -2500;
        if (star.z < -2500) star.z = 500;
    });
    render();
}, { passive: false });