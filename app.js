const galaxy = document.getElementById('galaxy');
const stars = [];

const domains = {
    // x: % of width, y: % of height (measured from center 0,0)
    'Work':     { xPct: -0.25, yPct: -0.25, color: '#00ffff' }, // Top-Left
    'Personal': { xPct: 0.25,  yPct: 0.1,  color: '#ff00ff' }, // Middle-Right
    'Study':    { xPct: 0,     yPct: -0.35, color: '#ffff00' }  // Top-Center
};

function addStar() {
    const input = document.getElementById('taskInput');
    const domainKey = document.getElementById('domainInput').value;
    const priority = document.getElementById('priorityInput').value;

    if (!input.value) return;

    const domainConfig = domains[domainKey];

    // --- RESPONSIVE POSITIONING LOGIC ---
    // We multiply the percentage by the current window size
    const centerX = window.innerWidth * domainConfig.xPct;
    const centerY = window.innerHeight * domainConfig.yPct;

    const starData = {
        name: input.value,
        domain: domainKey,
        // Spread stars randomly around the center of their sector
        x: centerX + (Math.random() - 0.5) * (window.innerWidth * 0.2),
        y: centerY + (Math.random() - 0.5) * (window.innerHeight * 0.2),
        
        // Z remains deep for the 3D effect
        z: priority === 'high' ? -250 : -750, 
        color: domainConfig.color,
        el: document.createElement('div')
    };

    // ... (rest of your star creation, element styling, and click logic) ...
    starData.el.className = 'star';
    starData.el.style.background = `radial-gradient(circle, #fff 0%, ${starData.color} 60%, transparent 100%)`;
    starData.el.style.boxShadow = `0 0 25px ${starData.color}`;
    starData.el.innerHTML = `<span>${starData.name}</span>`;
    
    // Smooth delete logic (keep your current version)
    starData.el.onclick = () => {
        explode(starData.x, starData.y, starData.z, starData.color);
        starData.el.style.transform += " scale(0)";
        starData.el.style.opacity = '0';
        setTimeout(() => {
            const idx = stars.indexOf(starData);
            if(idx > -1) stars.splice(idx, 1);
            starData.el.remove();
            saveGalaxy();
            render();
        }, 300);
    };

    galaxy.appendChild(starData.el);
    stars.push(starData);
    saveGalaxy();
    input.value = '';
    render();
}

function render() {
    const lineContainer = document.getElementById('lines');
    let svgContent = "";
    const focalLength = 800;

    stars.forEach((star) => {
        // Projection Math
        const scale = focalLength / (focalLength + Math.abs(star.z));
        const x2d = star.x * scale + (window.innerWidth / 2);
        const y2d = star.y * scale + (window.innerHeight / 2);

        star.el.style.transform = `translate3d(${x2d}px, ${y2d}px, 0) scale(${scale})`;
        star.el.style.opacity = scale;
        const label = star.el.querySelector('span');
if (label) {
    // If star is far (scale < 0.4), hide the label's opacity
    // But the CSS :hover will override this!
    label.style.opacity = scale > 0.4 ? "1" : "0";
    label.style.fontSize = "14px"; // Keep base size 14px so it's ready when hovered
}

        // Domain Lines
        const sameDomainStars = stars.filter(s => s.domain === star.domain);
        const myIdx = sameDomainStars.indexOf(star);
        
        if (myIdx > 0) {
            const prev = sameDomainStars[myIdx - 1];
            const pScale = focalLength / (focalLength + Math.abs(prev.z));
            const px2d = prev.x * pScale + (window.innerWidth / 2);
            const py2d = prev.y * pScale + (window.innerHeight / 2);

            svgContent += `
                <line x1="${x2d}" y1="${y2d}" x2="${px2d}" y2="${py2d}" 
                      stroke="${star.color}" 
                      style="opacity: ${scale * 0.3}"
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
        
        // LIMITS: Prevents stars flying past head (Intuitive Hard Stop)
        if (star.z > -100) star.z = -100; 
        // LIMITS: Prevents stars disappearing into infinity
        if (star.z < -3000) star.z = -3000;
    });
    render();
}, { passive: false }); 

function saveGalaxy() {
    const data = stars.map(s => ({
        name: s.name, x: s.x, y: s.y, z: s.z, color: s.color, domain: s.domain
    }));
    localStorage.setItem('myNeuralGalaxy', JSON.stringify(data));
}

window.onload = () => {
    const saved = localStorage.getItem('myNeuralGalaxy');
    if (saved) {
        JSON.parse(saved).forEach(data => {
            const starData = { ...data, el: document.createElement('div') };
            starData.el.className = 'star';
            starData.el.style.background = `radial-gradient(circle, #fff 0%, ${data.color} 60%, transparent 100%)`;
            starData.el.style.boxShadow = `0 0 20px ${data.color}`;
            starData.el.innerHTML = `<span>${data.name}</span>`;
            
            // Fixed: Real delete logic added here
            starData.el.onclick = () => {
                starData.el.style.transform += " scale(0)";
                starData.el.style.opacity = '0';
                setTimeout(() => {
                    const idx = stars.indexOf(starData);
                    if(idx > -1) stars.splice(idx, 1);
                    starData.el.remove();
                    saveGalaxy();
                    render();
                }, 300);
            };
            
            galaxy.appendChild(starData.el);
            stars.push(starData);
        });
        render();
    }
};
function clearGalaxy() {
    if (confirm("Are you sure you want to clear your entire neural map?")) {
        // 1. Wipe the data array
        stars.length = 0;

        // 2. Wipe the visual elements
        galaxy.innerHTML = '';
        document.getElementById('lines').innerHTML = '';

        // 3. Wipe the save file
        localStorage.removeItem('myNeuralGalaxy');
        
        console.log("Galaxy Reset.");
        render(); // Force a final render to ensure lines are gone
    }
}
function explode(x, y, z, color) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = color;
        p.style.boxShadow = `0 0 10px ${color}`;
        galaxy.appendChild(p);

        // Random direction for the explosion
        const velocityX = (Math.random() - 0.5) * 500;
        const velocityY = (Math.random() - 0.5) * 500;
        const velocityZ = (Math.random() - 0.5) * 500;

        // Use the same projection math to place the particle initially
        const focalLength = 800;
        const scale = focalLength / (focalLength + Math.abs(z));
        const screenX = x * scale + (window.innerWidth / 2);
        const screenY = y * scale + (window.innerHeight / 2);

        p.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) scale(${scale})`;

        // Animate the explosion after a tiny delay
        setTimeout(() => {
            const finalScale = 0;
            const finalX = (x + velocityX) * scale + (window.innerWidth / 2);
            const finalY = (y + velocityY) * scale + (window.innerHeight / 2);
            
            p.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(${finalScale})`;
            p.style.opacity = '0';
        }, 10);

        // Cleanup the particles from the DOM
        setTimeout(() => p.remove(), 800);
    }
}
window.addEventListener('resize', () => {
    render(); // Recalculates 2D positions based on new window size
});
