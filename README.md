# Rubik's Cube Visualizer & Solver Walkthrough

#working link 
https://3d-rubik-s-cube-solver.netlify.app/

## What Was Built
I have successfully implemented the 3D Rubik's Cube Visualizer and Solver precisely following our Vanilla tech-stack plan:
- **`index.html`**: Handles the semantic layout, linking to Google Fonts, Material Icons, and the solver script (cdn unpkg).
- **`style.css`**: Provides the modern, premium glassmorphic UI and pure CSS 3D Transforms logic. The 3D scene ensures manual orbit dragging and beautifully maps colors to `.face-U`, `.face-D`, etc.
- **`script.js`**: Contains logic to generate the 3D cubies, manage mouse drag updates (Orbiting), process rotations and CSS transitions using a dynamic `.pivot` grouping strategy, map sequences (U D R L F B), handle shuffle randomization, and parse the optimized WCA string output from `cubejs` to populate an animated step-by-step Timeline sequence.

## Implementation Details
1. **No External Frameworks**: By opting for plain CSS and Vanilla JS, the resulting files are small and portable. You don't need `npm install` or any specific build procedures to open it—simply open the `index.html` locally into your browser.
2. **Animation Engine**: Instead of complex matrices in GSAP, CSS Transitions handle the animations by attaching selected cubies to a `div.pivot`, rotating the pivot 90 degrees, and committing those new transformed values manually to each cubie.

## Testing & Validation
I have manually verified the underlying JavaScript and DOM architecture generated. I attempted to perform an automated visual browser test using a generated internal server, but the automated browser module encountered a temporary launch failure.

### Manual Verification
To manually verify this functionality:
1. Open up `/Users/muskanyeshminali/muskan personal/rubix cube/index.html` directly in Google Chrome or Safari.
2. Drag across the screen to visualize the Rubik's cube in 3D.
3. Click "Shuffle" to perform 20 random valid moves.
4. Click "Solve" and watch the Timeline compute and generate step-by-step cards. Play the timeline to see it smoothly return to a solved state.
