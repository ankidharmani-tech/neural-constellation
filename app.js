const galaxy = document.getElementById('galaxy');
const stars = [];


const domains = {
    'Work':     { x: -500, y: -500, color: '#00ffff' },
    'Personal': { x: 500,  y: 500,  color: '#ff00ff' },
    'Study':    { x: 500,  y: -500, color: '#ffff00' }  
};

function addStar() {
    const Tinput = document.getElementById('taskInput');
    const domainKey = document.getElementById('domainInput').value;
    const priority = document.getElementById('priorityInput').value;

    const H = parseInt(document.getElementById('custom-hours').value) || 0;
    const M = parseInt(document.getElementById('custom-minutes').value) || 0;
    const S = parseInt(document.getElementById('custom-seconds').value) || 0;

   const starLyf=(H*3600)+(M*60)+S

    if (!Tinput.value.trim()) {
        //changes the border color red if task is empty
        Tinput.style.borderBottom = "1px solid red";
        Tinput.placeholder = "Name required!";
        setTimeout(() => {
            Tinput.style.borderBottom = "1px solid cyan";
            Tinput.placeholder = "Enter task name";
        }, 2000);
        return;
    }

    const domainConfig = domains[domainKey];

    const starData = {
        name: Tinput.value,
        domain: domainKey,
        x: domainConfig.x + (Math.random() - 0.5) * 400,
        y: domainConfig.y + (Math.random() - 0.5) * 400,
        z: priority === 'high' ? -300 : -1500, // Urgent is closer
        color: domainConfig.color,
        timeleft:starLyf>0?starLyf:null,
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
    Tinput.value = '';
    document.getElementById('custom-hours').value='';
    document.getElementById('custom-minutes').value='';
    document.getElementById('custom-seconds').value='';

    render();
}
// Updated Render for Domain-Specific Lines
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

        // BRAIN MOVE: Connect to the previous star IN THE SAME DOMAIN
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
        color: s.color,
        domain: s.domain,
        name: s.name,
        x: s.x,
        y: s.y,
        z: s.z,
        timeleft:s.timeleft
    }));
    localStorage.setItem('myNeuralGalaxy', JSON.stringify(data));
}

// call saveGalaxy whenever stars array changes
window.onload = () => {
    const saved = localStorage.getItem('myNeuralGalaxy');
    if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(data => {
            // recreates each star from local storage
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

//fucntion for the stars to kill themselves when time is up
setInterval(() => {
    let changed = false;

    stars.forEach((star, index) => {
        if (star.timeleft!== null) {
            star.timeleft--;
            changed = true;


            const hours = Math.floor(star.timeleft / 3600);
            const mins = Math.floor((star.timeleft % 3600) / 60);
            const secs = star.timeleft % 60;

            // Format as HH:MM:SS
            const timeStr = `${hours}h ${mins}m ${secs}s`;
            star.el.querySelector('span').innerHTML = `${star.name} <br> <small style="opacity:0.7">${timeStr}</small>`;

            // DEATH LOGIC
            if (star.timeleft <= 0) {
                star.el.style.filter = "brightness(5) blur(10px)"; // "Supernova" effect
                star.el.style.opacity = '0';

                setTimeout(() => {
                    const idx = stars.indexOf(star);
                    if (idx > -1) stars.splice(idx, 1);
                    star.el.remove();
                    saveGalaxy();
                }, 500);
            }
        }
    });

    if (changed) render(); // Re-render to update the labels
}, 1000);




