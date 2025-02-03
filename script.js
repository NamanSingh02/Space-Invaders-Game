// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state flags
let gameRunning = false;   // whether the game loop is active
let gameOver = false;      // whether the game is over (win or lose)

// Player settings
const playerWidth = 40;
const playerHeight = 20;
let playerX = canvas.width / 2 - playerWidth / 2;
const playerY = canvas.height - playerHeight - 10;
const playerSpeed = 5;

// Bullet settings
const bulletWidth = 4;
const bulletHeight = 10;
const bulletSpeed = 7;
let bullets = [];

// Invader settings
const invaderRowCount = 5;
const invaderColumnCount = 10;
const invaderWidth = 30;
const invaderHeight = 20;
const invaderPadding = 10;
const invaderOffsetTop = 30;
const invaderOffsetLeft = 30;
let invaders = [];
let invaderDx = 1;       // Horizontal movement speed
const invaderDy = 40;    // Vertical shift when an edge is hit

// Input flags
let rightPressed = false;
let leftPressed = false;
let canShoot = true;     // To prevent continuous shooting while holding the space bar

// Event listeners for keyboard input
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
  if (e.code === "ArrowRight") {
    rightPressed = true;
  } else if (e.code === "ArrowLeft") {
    leftPressed = true;
  } else if (e.code === "Space") {
    if (canShoot && gameRunning) {
      // Fire a bullet from the center of the player's ship
      bullets.push({ x: playerX + playerWidth / 2 - bulletWidth / 2, y: playerY });
      canShoot = false;
    }
  }
}

function keyUpHandler(e) {
  if (e.code === "ArrowRight") {
    rightPressed = false;
  } else if (e.code === "ArrowLeft") {
    leftPressed = false;
  } else if (e.code === "Space") {
    canShoot = true;
  }
}

// Draw the player's ship
function drawPlayer() {
  ctx.fillStyle = "green";
  ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
}

// Draw a bullet
function drawBullet(bullet) {
  ctx.fillStyle = "yellow";
  ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
}

// Draw the invaders
function drawInvaders() {
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        const inv = invaders[r][c];
        ctx.fillStyle = "red";
        ctx.fillRect(inv.x, inv.y, invaderWidth, invaderHeight);
      }
    }
  }
}

// Check for bullet and invader collisions
function collisionDetection() {
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        const inv = invaders[r][c];
        if (inv.status === 1) {
          if (
            b.x > inv.x &&
            b.x < inv.x + invaderWidth &&
            b.y > inv.y &&
            b.y < inv.y + invaderHeight
          ) {
            inv.status = 0; // Mark invader as hit
            bullets.splice(i, 1); // Remove bullet
            i--;
            return; // Only handle one collision per update cycle
          }
        }
      }
    }
  }
}

// Update invader positions and check lose condition
function updateInvaders() {
  let shiftDown = false;

  // Check if any invader (that is still alive) is going to hit the side of the canvas.
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      const inv = invaders[r][c];
      if (inv.status === 1) {
        if (invaderDx > 0 && inv.x + invaderWidth >= canvas.width) {
          shiftDown = true;
          break;
        } else if (invaderDx < 0 && inv.x <= 0) {
          shiftDown = true;
          break;
        }
      }
    }
    if (shiftDown) break;
  }

  if (shiftDown) {
    // Shift down all invaders and reverse horizontal direction.
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        const inv = invaders[r][c];
        if (inv.status === 1) {
          inv.y += invaderDy;
          inv.x += invaderDx; // Nudge away from the edge.
        }
      }
    }
    invaderDx = -invaderDx;
  } else {
    // Move invaders horizontally.
    for (let r = 0; r < invaderRowCount; r++) {
      for (let c = 0; c < invaderColumnCount; c++) {
        const inv = invaders[r][c];
        if (inv.status === 1) {
          inv.x += invaderDx;
        }
      }
    }
  }

  // Check lose condition: if any invader reaches the player's row.
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      const inv = invaders[r][c];
      if (inv.status === 1 && inv.y + invaderHeight >= playerY) {
        endGame(false); // Player loses
        return;
      }
    }
  }
}

// Main game update function
function update() {
  if (!gameRunning) return; // stop the loop if game is not running

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move player based on key presses
  if (rightPressed && playerX < canvas.width - playerWidth) {
    playerX += playerSpeed;
  }
  if (leftPressed && playerX > 0) {
    playerX -= playerSpeed;
  }

  // Update bullet positions
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= bulletSpeed;
    // Remove bullets that leave the canvas
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      i--;
    }
  }

  // Update invader positions and check for collisions
  updateInvaders();
  collisionDetection();

  // Draw game objects
  drawPlayer();
  bullets.forEach(drawBullet);
  drawInvaders();

  // Check win condition: all invaders are eliminated
  let allCleared = true;
  for (let r = 0; r < invaderRowCount; r++) {
    for (let c = 0; c < invaderColumnCount; c++) {
      if (invaders[r][c].status === 1) {
        allCleared = false;
        break;
      }
    }
  }
  if (allCleared) {
    endGame(true); // Player wins
    return;
  }

  requestAnimationFrame(update);
}

// End the game and show the overlay with a message and play again button.
function endGame(playerWon) {
  gameRunning = false;
  gameOver = true;
  const overlay = document.getElementById("overlay");
  const message = document.getElementById("message");
  if (playerWon) {
    message.textContent = "You Win!";
  } else {
    message.textContent = "You Lose!";
  }
  // Change the start button to "Play Again"
  const startButton = document.getElementById("startButton");
  startButton.textContent = "Play Again";
  overlay.style.display = "flex";
}

// Initialize or reset the game variables.
function initGame() {
  // Reset game state flags
  gameRunning = true;
  gameOver = false;

  // Reset player position
  playerX = canvas.width / 2 - playerWidth / 2;
  // Clear bullets array
  bullets = [];

  // Reset invaders array
  invaders = [];
  for (let r = 0; r < invaderRowCount; r++) {
    invaders[r] = [];
    for (let c = 0; c < invaderColumnCount; c++) {
      const invaderX = invaderOffsetLeft + c * (invaderWidth + invaderPadding);
      const invaderY = invaderOffsetTop + r * (invaderHeight + invaderPadding);
      invaders[r][c] = { x: invaderX, y: invaderY, status: 1 };
    }
  }
  // Reset horizontal invader speed
  invaderDx = 1;
}

// Start or restart the game when the button is pressed.
document.getElementById("startButton").addEventListener("click", function() {
  // Hide the overlay
  document.getElementById("overlay").style.display = "none";
  // Initialize the game state
  initGame();
  // Start the game loop if it's not already running
  if (!gameRunning) {
    gameRunning = true;
    update();
  } else {
    // If restarting, call update immediately.
    update();
  }
});
