const galaxy = document.getElementById('galaxy');
const stars = [];


const domains = {
    'Work':     { x: -500, y: -500, color: '#00ffff' },
    'Personal': { x: 500,  y: 500,  color: '#ff00ff' },
    'Study':    { x: 500,  y: -500, color: '#ffff00' }  
};

function addStar() {
    const input = document.getElementById('taskInput');
    const domainKey = document.getElementById('domainInput').value;
    const priority = document.getElementById('priorityInput').value;

    if (!input.value) return;

    const domainConfig = domains[domainKey];

    const starData = {
        name: input.value,
        domain: domainKey,
        x: domainConfig.x + (Math.random() - 0.5) * 400,
        y: domainConfig.y + (Math.random() - 0.5) * 400,
        z: priority === 'high' ? -300 : -1500, // Urgent is closer
        color: domainConfig.color,
        el: document.createElement('div')
    };

    starData.el.className = 'star';
    starData.el.style.background = `radial-gradient(circle, #fff 0%, ${starData.color} 60%, transparent 100%)`;
    starData.el.style.boxShadow = `0 0 20px ${starData.color}`;
    starData.el.innerHTML = `<span>${starData.name}</span>`;
    
    // Add Click to Delete with Save
    starData.el.onclick = () => {
        starData.el.style.opacity = '0';
        setTimeout(() => {
            stars.splice(stars.indexOf(starData), 1);
            starData.el.remove();
            saveGalaxy(); // Update storage
            render();
        }, 300);
    };

    galaxy.appendChild(starData.el);
    stars.push(starData);
    saveGalaxy(); // Save the new star
    input.value = '';
    render();
}

/
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
        star.el.style.fontSize = scale > 0.5 ? "12px" : "0px";

    
        const sameDomainStars = stars.filter(s => s.domain === star.domain);
        const myIdx = sameDomainStars.indexOf(star);
        
        if (myIdx > 0) {
            const prev = sameDomainStars[myIdx - 1];
            const pScale = focalLength / (focalLength + Math.abs(prev.z));
            const px2d = prev.x * pScale + (window.innerWidth / 2);
            const py2d = prev.y * pScale + (window.innerHeight / 2);

            svgContent += `
                <line x1="${x2d}" y1="${y2d}" x2="${px2d}" y2="${py2d}" 
                      class="neural-line"
                      stroke="${star.color}" 
                      style="opacity: ${scale * 0.4}"
                      stroke-width="${2 * scale}" />
            `;
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
// save to local storage
function saveGalaxy() {
    const data = stars.map(s => ({
        name: s.name, x: s.x, y: s.y, z: s.z, color: s.color, domain: s.domain
    }));
    localStorage.setItem('myNeuralGalaxy', JSON.stringify(data));
}

// call saveGalaxy whenever stars array changes
window.onload = () => {
    const saved = localStorage.getItem('myNeuralGalaxy');
    if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(data => {
            // recreates each star from lcoal storage
            const starData = { ...data, el: document.createElement('div') };
            starData.el.className = 'star';
            starData.el.style.background = `radial-gradient(circle, #fff 0%, ${data.color} 60%, transparent 100%)`;
            starData.el.innerHTML = `<span>${data.name}</span>`;
            galaxy.appendChild(starData.el);
            stars.push(starData);
        });
        render();
    }
};
