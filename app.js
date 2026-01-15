/**
 * GLOBAL CONFIGURATION
 * galaxy: The main container for 3D star elements.
 * stars:  The central state array that stores all active task objects.
 * domains: Maps task categories to spatial sectors using viewport percentages.
 */
const galaxy = document.getElementById('galaxy');
const stars = [];

const domains = {
    // xPct/yPct define the center of each domain relative to the screen center (0,0)
    'Work':     { xPct: -0.25, yPct: -0.25, color: '#00ffff' }, 
    'Personal': { xPct: 0.25,  yPct: 0.1,  color: '#ff00ff' }, 
    'Study':    { xPct: 0,     yPct: -0.35, color: '#ffff00' }  
};

/**
 * FUNCTION: addStar
 * Purpose: Captures user input to create a new task star.
 * Logic: 
 * 1. Calculates responsive coordinates based on current window size.
 * 2. Assigns a Z-depth (priority) for the 3D perspective.
 * 3. Injects the element into the DOM and the central data array.
 */
function addStar() {
    const input = document.getElementById('taskInput');
    const domainKey = document.getElementById('domainInput').value;
    const priority = document.getElementById('priorityInput').value;

    if (!input.value) return;

    const domainConfig = domains[domainKey];

    // Responsive Positioning: Translates percentages to actual pixels based on current window
    const centerX = window.innerWidth * domainConfig.xPct;
    const centerY = window.innerHeight * domainConfig.yPct;

    const starData = {
        name: input.value,
        domain: domainKey,
        // Spreads stars randomly within a 20% width/height "sector" of the center
        x: centerX + (Math.random() - 0.5) * (window.innerWidth * 0.2),
        y: centerY + (Math.random() - 0.5) * (window.innerHeight * 0.2),
        z: priority === 'high' ? -250 : -750, // Higher priority starts closer to camera
        color: domainConfig.color,
        el: document.createElement('div')
    };

    // Styling the star element with a custom radial glow
    starData.el.className = 'star';
    starData.el.style.background = `radial-gradient(circle, #fff 0%, ${starData.color} 60%, transparent 100%)`;
    starData.el.style.boxShadow = `0 0 25px ${starData.color}`;
    starData.el.innerHTML = `<span>${starData.name}</span>`;
    
    // CLICK LOGIC: Triggers the particle explosion and removes the star from state/storage
    starData.el.onclick = () => {
        explode(starData.x, starData.y, starData.z, starData.color);
        starData.el.style.transform += " scale(0)";
        starData.el.style.opacity = '0';
        setTimeout(() => {
            const idx = stars.indexOf(starData);
            if(idx > -1) stars.splice(idx, 1);
            starData.el.remove();
            saveGalaxy(); // Syncs LocalStorage after deletion
            render();     // Updates constellation lines
        }, 300);
    };

    galaxy.appendChild(starData.el);
    stars.push(starData);
    saveGalaxy();
    input.value = '';
    render();
}

/**
 * FUNCTION: render
 * Purpose: The 3D Engine. Converts 3D (x,y,z) coordinates into 2D (x,y) screen positions.
 * Math: Uses Focal Length projection (Scale = Focal / (Focal + Distance)).
 * Features:
 * 1. Updates star scale/opacity based on distance.
 * 2. Dynamically draws SVG lines between stars of the same domain.
 */
function render() {
    const lineContainer = document.getElementById('lines');
    let svgContent = "";
    const focalLength = 800; // The virtual "camera" focal length

    stars.forEach((star) => {
        // PROJECTION MATH: Scales the 3D point to a 2D viewport
        const scale = focalLength / (focalLength + Math.abs(star.z));
        const x2d = star.x * scale + (window.innerWidth / 2);
        const y2d = star.y * scale + (window.innerHeight / 2);

        // Apply 3D transform and hide labels for distant stars to reduce clutter
        star.el.style.transform = `translate3d(${x2d}px, ${y2d}px, 0) scale(${scale})`;
        star.el.style.opacity = scale;
        const label = star.el.querySelector('span');
        if (label) {
            label.style.opacity = scale > 0.4 ? "1" : "0";
            label.style.fontSize = "14px";
        }

        // NEURAL LINKING: Filters same-domain stars and draws lines between sequential stars
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

/**
 * EVENT: Mouse Wheel
 * Purpose: Navigation through the Z-axis (Depth).
 * Constraint: Clamps the movement so stars don't pass the camera (-100) or go too far (-3000).
 */
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    stars.forEach(star => {
        star.z += e.deltaY * 0.8; // Scroll vertical moves camera deep/shallow
        
        if (star.z > -100) star.z = -100;  
        if (star.z < -3000) star.z = -3000;
    });
    render();
}, { passive: false }); 

/**
 * FUNCTION: saveGalaxy
 * Purpose: Persists the current star array to LocalStorage as a JSON string.
 */
function saveGalaxy() {
    const data = stars.map(s => ({
        name: s.name, x: s.x, y: s.y, z: s.z, color: s.color, domain: s.domain
    }));
    localStorage.setItem('myNeuralGalaxy', JSON.stringify(data));
}

/**
 * EVENT: window.onload
 * Purpose: Hydrates the application on refresh by rebuilding stars from storage.
 */
window.onload = () => {
    const saved = localStorage.getItem('myNeuralGalaxy');
    if (saved) {
        JSON.parse(saved).forEach(data => {
            const starData = { ...data, el: document.createElement('div') };
            starData.el.className = 'star';
            starData.el.style.background = `radial-gradient(circle, #fff 0%, ${data.color} 60%, transparent 100%)`;
            starData.el.style.boxShadow = `0 0 20px ${data.color}`;
            starData.el.innerHTML = `<span>${data.name}</span>`;
            
            // Re-binds the click/delete/render logic to hydrated elements
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

/**
 * FUNCTION: clearGalaxy
 * Purpose: Full system reset. Wipes memory, storage, and the DOM.
 */
function clearGalaxy() {
    if (confirm("Are you sure you want to clear your entire neural map?")) {
        stars.length = 0;
        galaxy.innerHTML = '';
        document.getElementById('lines').innerHTML = '';
        localStorage.removeItem('myNeuralGalaxy');
        render();
    }
}

/**
 * FUNCTION: explode
 * Purpose: Visual feedback for task completion.
 * Logic: Spawns 15 particle elements at the star's 3D location and 
 * flings them outward in random 3D directions before removing them.
 */
function explode(x, y, z, color) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = color;
        p.style.boxShadow = `0 0 10px ${color}`;
        galaxy.appendChild(p);

        const velocityX = (Math.random() - 0.5) * 500;
        const velocityY = (Math.random() - 0.5) * 500;
        
        const focalLength = 800;
        const scale = focalLength / (focalLength + Math.abs(z));
        const screenX = x * scale + (window.innerWidth / 2);
        const screenY = y * scale + (window.innerHeight / 2);

        p.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) scale(${scale})`;

        setTimeout(() => {
            const finalScale = 0;
            const finalX = (x + velocityX) * scale + (window.innerWidth / 2);
            const finalY = (y + velocityY) * scale + (window.innerHeight / 2);
            
            p.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) scale(${finalScale})`;
            p.style.opacity = '0';
        }, 10);

        setTimeout(() => p.remove(), 800);
    }
}

/**
 * EVENT: Resize
 * Purpose: Ensures the constellation remains centered if the browser window size changes.
 */
window.addEventListener('resize', () => {
    render(); 
});
