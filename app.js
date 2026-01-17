/**
 * -------------------------------------------------------------------------
 * GLOBAL STATE & CONFIGURATION
 * -------------------------------------------------------------------------
 */
const galaxy = document.getElementById('galaxy');
const stars = []; // Array of star objects: {name, domain, x, y, z, color, timeleft, el}

/**
 * Domain Anchor Points
 * Defines where clusters form in the 3D coordinate system.
 */
const domains = {
    'Work':     { x: -500, y: -500, color: '#00ffff' },
    'Personal': { x: 500,  y: 500,  color: '#ff00ff' },
    'Study':    { x: 500,  y: -500, color: '#ffff00' }
};

/**
 * STAR CREATION
 * Triggered by the "Birth Star" button. Captures UI input and initializes task objects.
 */
function addStar() {
    const Tinput = document.getElementById('taskInput');
    const domainKey = document.getElementById('domainInput').value;
    const priority = document.getElementById('priorityInput').value;

    // Time calculations: convert HH:MM:SS inputs into total seconds
    const H = parseInt(document.getElementById('custom-hours').value) || 0;
    const M = parseInt(document.getElementById('custom-minutes').value) || 0;
    const S = parseInt(document.getElementById('custom-seconds').value) || 0;
    const starLyf = (H * 3600) + (M * 60) + S;

    // Validation: Ensure the task has a name
    if (!Tinput.value.trim()) {
        Tinput.style.borderBottom = "1px solid red";
        Tinput.placeholder = "Name required!";
        setTimeout(() => {
            Tinput.style.borderBottom = "1px solid cyan";
            Tinput.placeholder = "Enter task name";
        }, 2000);
        return;
    }

    const domainConfig = domains[domainKey];

    // Create the data structure for the star
    const starData = {
        name: Tinput.value,
        domain: domainKey,
        // Spread stars randomly around their domain cluster point
        x: domainConfig.x + (Math.random() - 0.5) * 400,
        y: domainConfig.y + (Math.random() - 0.5) * 400,
        // Depth logic: Urgent tasks start closer to the "camera" (Z-axis)
        z: priority === 'high' ? -300 : -1500,
        color: domainConfig.color,
        timeleft: starLyf > 0 ? starLyf : null,
        el: document.createElement('div')
    };

    // Initialize DOM element
    starData.el.className = 'star';
    if (priority === 'high') starData.el.classList.add('urgent');
    starData.el.style.background = `radial-gradient(circle, #fff 0%, ${starData.color} 60%, transparent 100%)`;
    starData.el.style.boxShadow = `0 0 20px ${starData.color}`;
    starData.el.innerHTML = `<span>${starData.name}</span>`;

    // Manual removal: Click star to delete and update storage
    starData.el.onclick = () => {
        starData.el.style.opacity = '0';
        setTimeout(() => {
            const idx = stars.indexOf(starData);
            if (idx > -1) stars.splice(idx, 1);
            starData.el.remove();
            saveGalaxy();
            render();
        }, 300);
    };

    galaxy.appendChild(starData.el);
    stars.push(starData);

    // Save to LocalStorage and clear form
    saveGalaxy();
    Tinput.value = '';
    ['custom-hours', 'custom-minutes', 'custom-seconds'].forEach(id => {
        document.getElementById(id).value = '';
    });

    render();
}

/**
 * 3D RENDERING ENGINE
 * Maps 3D (x, y, z) coordinates to 2D screen pixels and draws SVG connections.
 */
function render() {
    const lineContainer = document.getElementById('lines');
    let svgContent = "";
    const focalLength = 800; // Determines the perspective intensity

    stars.forEach((star) => {
        // Perspective Math: Objects get smaller/center-aligned as Z increases
        const scale = focalLength / (focalLength + Math.abs(star.z));
        const x2d = star.x * scale + (window.innerWidth / 2);
        const y2d = star.y * scale + (window.innerHeight / 2);

        // Update star position and visual depth
        star.el.style.setProperty('--tx', `${x2d}px`);
        star.el.style.setProperty('--ty', `${y2d}px`);
        star.el.style.setProperty('--s', scale);
        star.el.style.transform = `translate3d(var(--tx), var(--ty), 0) scale(var(--s))`;
        star.el.style.opacity = scale;
        star.el.style.fontSize = scale > 0.5 ? "12px" : "0px"; // Hide text if too far

        // NEURAL CONNECTIONS: Link star to the previous one in the same domain
        const sameDomainStars = stars.filter(s => s.domain === star.domain);
        const myIdx = sameDomainStars.indexOf(star);

        if (myIdx > 0) {
            const prev = sameDomainStars[myIdx - 1];
            const pScale = focalLength / (focalLength + Math.abs(prev.z));
            const px2d = prev.x * pScale + (window.innerWidth / 2);
            const py2d = prev.y * pScale + (window.innerHeight / 2);

            // Generate SVG line code
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

/**
 * CAMERA CONTROLS
 * Moves stars along the Z-axis based on mouse wheel movement.
 */
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    stars.forEach(star => {
        star.z += e.deltaY * 0.8;
        // Infinite loop: if star goes too far back or forward, reset to other end
        if (star.z > 500) star.z = -2500;
        if (star.z < -2500) star.z = 500;
    });
    render();
}, { passive: false });

/**
 * DATA PERSISTENCE
 * Saves current constellation state to LocalStorage as a JSON string.
 */
function saveGalaxy() {
    const data = stars.map(s => ({
        color: s.color,
        domain: s.domain,
        name: s.name,
        x: s.x,
        y: s.y,
        z: s.z,
        timeleft: s.timeleft
    }));
    localStorage.setItem('myNeuralGalaxy', JSON.stringify(data));
}

/**
 * INITIALIZATION
 * On page load, rehydrate stars from LocalStorage.
 */
window.onload = () => {
    const saved = localStorage.getItem('myNeuralGalaxy');
    if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(data => {
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

/**
 * LIFECYCLE TICKER (1 Second Interval)
 * Handles task countdowns, CSS animations for urgency, and the "Supernova" death effect.
 */
setInterval(() => {
    let changed = false;

    stars.forEach((star) => {
        if (star.timeleft !== null) {
            star.timeleft--;
            changed = true;

            // URGENCY UI: Pulse effect when less than 30 seconds remain
            if (star.timeleft <= 30) {
                star.el.classList.add('critical-state');
            }

            // Time Formatting (HH:MM:SS)
            const hours = Math.floor(star.timeleft / 3600);
            const mins = Math.floor((star.timeleft % 3600) / 60);
            const secs = star.timeleft % 60;
            const timeStr = `${hours}h ${mins}m ${secs}s`;

            star.el.querySelector('span').innerHTML = `${star.name} <br> <small style="opacity:0.7">${timeStr}</small>`;

            // DEATH LOGIC: Trigger supernova when timer hits 0
            if (star.timeleft <= 0) {
                star.el.style.filter = "brightness(5) blur(10px)";
                star.el.style.opacity = '0';

                // Cleanup data and DOM after animation finishes
                setTimeout(() => {
                    const idx = stars.indexOf(star);
                    if (idx > -1) stars.splice(idx, 1);
                    star.el.remove();
                    saveGalaxy();
                }, 500);
            }
        }
    });

    if (changed) render(); // Re-render to refresh labels and connections
}, 1000);