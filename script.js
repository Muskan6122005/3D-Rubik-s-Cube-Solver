/* 
 * Rubik's Cube Visualizer & Solver Logic 
 * Pure Vanilla JS handling 3D Math via matrices and CSS 3D Transforms.
 */

// --- Cube Data Math & Constants ---
const CUBIE_SIZE = 60;
const CUBE_GAP = 3;
const OFFSET = CUBIE_SIZE + CUBE_GAP;

let cubies = []; // stores DOM elements and their current 3D pos/rot
let isAnimating = false;
let moveQueue = [];
let timelineMoves = [];
let timelineIndex = 0;
let moveHistory = []; // Track history to construct the reverse solve

const faces = ['U', 'D', 'F', 'B', 'R', 'L'];

// Create the 3D scene elements
const sceneElement = document.querySelector('.scene');
const cubeElement = document.getElementById('cube');
const pivotElement = document.createElement('div');
pivotElement.className = 'pivot';
cubeElement.appendChild(pivotElement);

// We define axes for slices: X (Right/Left), Y (Up/Down), Z (Front/Back)
const axes = {
    'R': { axis: 'X', val: 1, dir: -1 },
    'L': { axis: 'X', val: -1, dir: 1 },
    'U': { axis: 'Y', val: -1, dir: -1 },
    'D': { axis: 'Y', val: 1, dir: 1 },
    'F': { axis: 'Z', val: 1, dir: -1 },
    'B': { axis: 'Z', val: -1, dir: 1 }
};

// Initialize the visual cube
function initCube() {
    cubeElement.innerHTML = '';
    cubeElement.appendChild(pivotElement);
    cubies = [];

    for(let x = -1; x <= 1; x++) {
        for(let y = -1; y <= 1; y++) {
            for(let z = -1; z <= 1; z++) {
                createCubie(x, y, z);
            }
        }
    }
}

function createCubie(x, y, z) {
    const el = document.createElement('div');
    el.className = 'cubie';
    
    // Initial 3d translation
    const tx = x * OFFSET;
    const ty = y * OFFSET;
    const tz = z * OFFSET;
    
    // We will track the abstract coordinate and rotation matrix manually 
    // or just use DOM matrix handling. A simpler way is to keep a transformation string.
    let transformStr = `translate3d(${tx}px, ${ty}px, ${tz}px)`;
    el.style.transform = transformStr;
    
    // Add 6 faces
    faces.forEach(f => {
        const faceEl = document.createElement('div');
        faceEl.className = `face face-${f}`;
        
        // Add stickers only to outer sides
        if (
            (f === 'U' && y === -1) ||
            (f === 'D' && y === 1) ||
            (f === 'R' && x === 1) ||
            (f === 'L' && x === -1) ||
            (f === 'F' && z === 1) ||
            (f === 'B' && z === -1)
        ) {
            faceEl.classList.add('sticker');
        }
        
        el.appendChild(faceEl);
    });

    cubeElement.appendChild(el);
    cubies.push({
        el,
        x, y, z, 
        transform: transformStr
    });
}

initCube();

// --- Orbit Controls (Mouse Drag) ---
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cubeRotation = { x: -30, y: -45 };

sceneElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});
sceneElement.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
    };
    
    cubeRotation.x -= deltaMove.y * 0.5;
    cubeRotation.y += deltaMove.x * 0.5;
    
    cubeElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => { isDragging = false; });


// --- Move Logic ---

// Apply matrix rotation to coordinates
function rotateCoords(x, y, z, axis, direction) {
    if (axis === 'X') return { x, y: y * Math.cos(direction) - z * Math.sin(direction), z: y * Math.sin(direction) + z * Math.cos(direction) };
    if (axis === 'Y') return { x: x * Math.cos(direction) + z * Math.sin(direction), y, z: -x * Math.sin(direction) + z * Math.cos(direction) };
    if (axis === 'Z') return { x: x * Math.cos(direction) - y * Math.sin(direction), y: x * Math.sin(direction) + y * Math.cos(direction), z };
}

function roundCoord(c) {
    return Math.round(c);
}

function executeMove(moveStr, callback) {
    if(isAnimating) return;
    isAnimating = true;

    // Parse move (e.g. "R", "R'", "R2")
    const face = moveStr[0];
    const isPrime = moveStr.includes("'");
    const isDouble = moveStr.includes("2");
    
    const deg = 90 * (isPrime ? -1 : 1) * (isDouble ? 2 : 1);
    const rad = deg * (Math.PI / 180);
    const { axis, val, dir } = axes[face];
    
    // Actual rotation applied to DOM handles visual direction
    const visualDeg = deg * dir;
    
    // Find affected cubies
    const slice = cubies.filter(c => c[axis.toLowerCase()] === val);
    
    // Move to pivot conceptually
    slice.forEach(c => {
        pivotElement.appendChild(c.el);
    });
    
    // Animate Pivot
    pivotElement.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    pivotElement.style.transform = `rotate${axis}(${visualDeg}deg)`;

    // On complete
    setTimeout(() => {
        pivotElement.style.transition = 'none';
        pivotElement.style.transform = '';
        
        slice.forEach(c => {
            // Re-adopt to cube
            cubeElement.appendChild(c.el);
            
            // Calculate new internal logic coordinates
            const numTurns = isDouble ? 2 : (isPrime ? 3 : 1);
            let nx = c.x, ny = c.y, nz = c.z;
            for(let i=0; i<numTurns; i++){
                // 90 deg step rotation mapping matrix
                let tx=nx, ty=ny, tz=nz;
                if(axis==='X'){ ny = -tz*dir; nz = ty*dir; }
                if(axis==='Y'){ nx = tz*dir; nz = -tx*dir; }
                if(axis==='Z'){ nx = -ty*dir; ny = tx*dir; }
            }
            c.x = nx; c.y = ny; c.z = nz;
            
            // Bake pivot transform to the local element transform
            c.transform = c.transform + ` rotate${axis}(${visualDeg}deg)`;
            c.el.style.transform = c.transform;
        });

        isAnimating = false;
        if(callback) callback();
        processQueue();
    }, 300);
}

// Queue system for successive moves
function processQueue() {
    if(moveQueue.length > 0 && !isAnimating) {
        const next = moveQueue.shift();
        executeMove(next.move, next.cb);
    }
}

function addToQueue(moveStr, cb) {
    moveQueue.push({move: moveStr, cb});
    processQueue();
}

// --- UI Binding ---
document.querySelectorAll('.move-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const move = btn.getAttribute('data-move');
        addToQueue(move);
        addMoveToTimeline(move);
        moveHistory.push(move);
    });
});

document.getElementById('shuffleBtn').addEventListener('click', () => {
    const facesList = ['U','D','R','L','F','B'];
    const mods = ['','\'','2'];
    timelineMoves = [];
    document.getElementById('timeline').innerHTML = '';
    
    for(let i=0; i<20; i++){
        const m = facesList[Math.floor(Math.random()*facesList.length)] + mods[Math.floor(Math.random()*mods.length)];
        addToQueue(m);
        moveHistory.push(m);
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    moveQueue = [];
    moveHistory = [];
    document.getElementById('timeline').innerHTML = '<div class="placeholder-text">Timeline is empty.</div>';
    initCube();
});

// --- Solver Logic Integration ---
// --- Solver Logic Integration ---

// Utility to invert a move
function invertMove(m) {
    if(m.includes('2')) return m;
    if(m.includes("'")) return m[0];
    return m + "'";
}

document.getElementById('solveBtn').addEventListener('click', () => {
    document.getElementById('solveBtn').innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Solving...';
    
    setTimeout(() => {
        document.getElementById('solveBtn').innerHTML = '<span class="material-symbols-outlined">psychology</span> Solve';
        
        if(moveHistory.length === 0) {
            alert("Already solved or no moves made!");
            return;
        }
        
        // Calculate sequence to reverse history
        const moves = moveHistory.reverse().map(invertMove);
        moveHistory = []; // Solved!
        
        // Fill timeline
        document.getElementById('timeline').innerHTML = '';
        timelineMoves = moves;
        timelineIndex = 0;
        document.getElementById('moveCount').innerText = `${moves.length} moves`;
        
        moves.forEach((m, i) => {
            const card = document.createElement('div');
            card.className = 'move-card';
            card.id = `card-${i}`;
            card.innerText = m;
            document.getElementById('timeline').appendChild(card);
        });
        
        document.getElementById('playTimelineBtn').disabled = false;
        
        // Automatically start playing the solve animation!
        document.getElementById('playTimelineBtn').click();
    }, 50);
});

// Timeline Playback
document.getElementById('playTimelineBtn').addEventListener('click', () => {
    if(timelineIndex >= timelineMoves.length) return;
    document.getElementById('playTimelineBtn').disabled = true;
    
    function playNext() {
        if(timelineIndex >= timelineMoves.length) {
            document.getElementById('playTimelineBtn').disabled = false;
            return;
        }
        const mv = timelineMoves[timelineIndex];
        
        // Highlight logic
        if(timelineIndex > 0) document.getElementById(`card-${timelineIndex-1}`).classList.remove('active');
        const activeCard = document.getElementById(`card-${timelineIndex}`);
        if(activeCard) {
            activeCard.classList.add('active');
            activeCard.scrollIntoView({behavior: "smooth", inline: "center"});
        }
        
        addToQueue(mv, () => {
            timelineIndex++;
            playNext();
        });
    }
    
    playNext();
});

function addMoveToTimeline(move) {
    const tl = document.getElementById('timeline');
    if(tl.querySelector('.placeholder-text')) tl.innerHTML = '';
    
    const card = document.createElement('div');
    card.className = 'move-card';
    card.innerText = move;
    tl.appendChild(card);
    card.scrollIntoView({behavior: "smooth", inline: "center"});
}
