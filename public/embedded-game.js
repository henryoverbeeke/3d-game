// Embedded Claire's Adventure Game for Admin Panel
class EmbeddedClaireGame {
    constructor() {
        // Get canvas from the admin panel
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return;
        }

        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Game state
        this.gameState = 'playing';
        this.lives = 3;
        this.stars = 0;
        this.respawnPosition = new THREE.Vector3(0, 1, 0);

        // Power-up system
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.powerUpDuration = 5;

        // Boss state
        this.bossHealth = 100;
        this.bossMaxHealth = 100;
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.bossAttackTimer = 0;
        this.bossAttackCooldown = 3;

        // Admin mode (always enabled in embedded version)
        this.adminMode = true;
        this.godMode = false;
        this.infiniteLives = false;
        this.speedMultiplier = 1.0;
        this.jumpMultiplier = 1.0;
        this.deathCount = 0;
        this.physicsEnabled = true;
        this.gamePaused = false;
        this.particlesEnabled = true;
        this.rainbowTrail = false;
        this.discoLights = false;
        this.superSpeed = false;
        this.pathTracking = false;
        this.timeScale = 1.0;
        this.sessionStartTime = Date.now();

        // Player properties
        this.player = null;
        this.playerVelocity = new THREE.Vector3();
        this.isGrounded = false;
        this.isFlying = false;
        this.jumpCount = 0;
        this.maxJumps = 2;

        // Input handling
        this.keys = {};
        this.spacePressed = false;

        // Game objects
        this.platforms = [];
        this.spikes = [];
        this.collectibleStars = [];
        this.turtles = [];
        this.boss = null;
        this.powerUpObject = null;

        // Battle effects
        this.battleEffects = [];
        this.endingCubes = [];
        this.teleportParticles = [];
        this.returnParticles = [];

        // Boss abilities
        this.daggerCooldown = 2;
        this.healCooldown = 8;
        this.sonicCooldown = 5;
        this.lastDaggerTime = 0;
        this.lastHealTime = 0;
        this.lastSonicTime = 0;

        // Initialize
        this.init();
        this.setupEventListeners();
        this.createWorld();
        this.gameLoop();

        console.log("🎮 Embedded Claire's Adventure started with admin mode!");
    }

    init() {
        // Create lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(this.directionalLight);

        // Create clock for delta time
        this.clock = new THREE.Clock();

        // Handle canvas resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    setupEventListeners() {
        // Keyboard events - focus on canvas container
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Mouse events for camera control
        this.canvas.addEventListener('mousedown', () => {
            this.canvas.requestPointerLock();
        });

        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.canvas) {
                this.camera.rotation.y -= event.movementX * 0.002;
                this.camera.rotation.x -= event.movementY * 0.002;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            }
        });
    }

    createWorld() {
        this.createPlayer();
        this.createPlatforms();
        this.createSpikes();
        this.createStars();
        this.createTurtles();
        this.createPowerUp();
    }

    createPlayer() {
        const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.copy(this.respawnPosition);
        this.player.castShadow = true;
        this.scene.add(this.player);
    }

    createPlatforms() {
        // Create platform groups
        for (let i = 0; i < 12; i++) {
            const group = new THREE.Group();
            
            // Create 3 connected platforms
            for (let j = 0; j < 3; j++) {
                const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
                const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const platform = new THREE.Mesh(platformGeometry, platformMaterial);
                platform.position.set(j * 4, 0, 0);
                platform.receiveShadow = true;
                platform.castShadow = true;
                group.add(platform);
            }
            
            // Position the group
            group.position.set(i * 8, Math.random() * 5 + 2, (Math.random() - 0.5) * 20);
            this.scene.add(group);
            this.platforms.push(group);
        }
    }

    createSpikes() {
        // Add spikes to middle platform of each group
        this.platforms.forEach((group, index) => {
            const spikeGeometry = new THREE.ConeGeometry(0.5, 2, 6);
            const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            
            for (let i = 0; i < 4; i++) {
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                spike.position.set(
                    4 + (i % 2) * 1.5 - 0.75,
                    1.25,
                    (Math.floor(i / 2)) * 1.5 - 0.75
                );
                group.add(spike);
                this.spikes.push(spike);
            }
        });
    }

    createStars() {
        for (let i = 0; i < 15; i++) {
            const starGeometry = new THREE.SphereGeometry(0.3, 8, 6);
            const starMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.3
            });
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.set(
                Math.random() * 80 + 5,
                Math.random() * 10 + 3,
                (Math.random() - 0.5) * 30
            );
            star.userData = { rotationSpeed: Math.random() * 0.02 + 0.01 };
            this.scene.add(star);
            this.collectibleStars.push(star);
        }
    }

    createTurtles() {
        for (let i = 0; i < 2; i++) {
            const turtleGeometry = new THREE.SphereGeometry(0.8, 8, 6);
            const turtleMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const turtle = new THREE.Mesh(turtleGeometry, turtleMaterial);
            turtle.position.set(15 + i * 15, 3, 0);
            turtle.userData = { 
                speed: 1,
                direction: 1,
                originalX: turtle.position.x
            };
            turtle.castShadow = true;
            this.scene.add(turtle);
            this.turtles.push(turtle);
        }
    }

    createPowerUp() {
        const powerUpGeometry = new THREE.SphereGeometry(0.6, 12, 8);
        const powerUpMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff69b4,
            emissive: 0xff1493,
            emissiveIntensity: 0.5
        });
        this.powerUpObject = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        this.powerUpObject.position.set(25, 8, 0);
        this.scene.add(this.powerUpObject);
    }

    gameLoop() {
        let deltaTime = this.clock.getDelta();
        deltaTime *= this.timeScale;

        if (!this.gamePaused) {
            this.updatePlayer(deltaTime);
            this.updateTurtles(deltaTime);
            this.animateCollectibles(deltaTime);
            this.updatePowerUp(deltaTime);
            this.updateBoss(deltaTime);
            this.updateAdminFeatures(deltaTime);
        }

        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.gameLoop());
    }

    updatePlayer(deltaTime) {
        if (!this.player || this.gameState !== 'playing') return;

        const speed = 5 * this.speedMultiplier;
        const jumpForce = 10 * this.jumpMultiplier;
        const gravity = -20;

        // Handle input
        const moveVector = new THREE.Vector3();
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.x += 1;

        moveVector.normalize();
        moveVector.multiplyScalar(speed * deltaTime);
        this.player.position.add(moveVector);

        // Jumping
        const jumpPressed = this.keys['Space'];
        const jumpJustPressed = jumpPressed && !this.spacePressed;

        if (jumpJustPressed && this.jumpCount < this.maxJumps) {
            this.playerVelocity.y = jumpForce;
            this.jumpCount++;
        }

        this.spacePressed = jumpPressed;

        // Admin controls
        if (this.keys['KeyP'] && !this.pPressed) {
            this.activatePowerUp();
            console.log("👑 ADMIN: Power-up activated!");
        }
        this.pPressed = this.keys['KeyP'];

        if (this.keys['KeyE'] && !this.ePressed) {
            this.player.position.set(36, 10, 0);
            this.playerVelocity.set(0, 0, 0);
            console.log("👑 ADMIN: Teleported to boss area!");
        }
        this.ePressed = this.keys['KeyE'];

        // Apply gravity
        if (!this.isFlying && this.physicsEnabled) {
            this.playerVelocity.y += gravity * deltaTime;
        } else if (this.isFlying) {
            const flyUpPressed = this.keys['Space'];
            const flyDownPressed = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
            
            if (flyUpPressed) {
                this.playerVelocity.y = 8;
            } else if (flyDownPressed) {
                this.playerVelocity.y = -6;
            } else {
                this.playerVelocity.y = 0;
            }
        }

        // Apply velocity
        this.player.position.add(this.playerVelocity.clone().multiplyScalar(deltaTime));

        // Ground collision (only near starting area to allow falling detection)
        if (this.player.position.y <= 1 && this.player.position.x < 5) {
            this.player.position.y = 1;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
        } else {
            this.isGrounded = false;
        }

        // Check collisions
        this.checkCollisions();

        // Check boss area
        if (this.player.position.x > 35 && this.gameState === 'playing') {
            this.startBossFight();
        }
        
        // Check if player fell off the world
        if (this.player.position.y < -2) {
            console.log(`💀 Player fell off the world! Position: x=${this.player.position.x.toFixed(2)}, y=${this.player.position.y.toFixed(2)}, z=${this.player.position.z.toFixed(2)}`);
            console.log(`💀 Lives before: ${this.lives}, God Mode: ${this.godMode}, Infinite Lives: ${this.infiniteLives}`);
            this.takeDamage();
        }
    }

    checkCollisions() {
        // Platform collisions
        this.platforms.forEach(group => {
            group.children.forEach(platform => {
                const platformPos = new THREE.Vector3();
                platform.getWorldPosition(platformPos);
                
                const distance = this.player.position.distanceTo(platformPos);
                if (distance < 3 && this.player.position.y > platformPos.y && this.player.position.y < platformPos.y + 2) {
                    this.player.position.y = platformPos.y + 1;
                    this.playerVelocity.y = 0;
                    this.isGrounded = true;
                    this.jumpCount = 0;
                }
            });
        });

        // Spike collisions
        if (!this.godMode) {
            this.spikes.forEach(spike => {
                const spikePos = new THREE.Vector3();
                spike.getWorldPosition(spikePos);
                
                if (this.player.position.distanceTo(spikePos) < 1.5) {
                    this.takeDamage();
                }
            });
        }

        // Turtle collisions
        if (!this.godMode) {
            this.turtles.forEach(turtle => {
                if (this.player.position.distanceTo(turtle.position) < 2) {
                    this.takeDamage();
                }
            });
        }

        // Star collection
        this.collectibleStars = this.collectibleStars.filter(star => {
            if (this.player.position.distanceTo(star.position) < 1.5) {
                this.scene.remove(star);
                this.stars++;
                this.updateUI();
                return false;
            }
            return true;
        });

        // Power-up collection
        if (this.powerUpObject && this.player.position.distanceTo(this.powerUpObject.position) < 2) {
            this.activatePowerUp();
        }
    }

    updateTurtles(deltaTime) {
        this.turtles.forEach(turtle => {
            turtle.position.x += turtle.userData.direction * turtle.userData.speed * deltaTime;
            
            if (Math.abs(turtle.position.x - turtle.userData.originalX) > 10) {
                turtle.userData.direction *= -1;
            }
        });
    }

    animateCollectibles(deltaTime) {
        this.collectibleStars.forEach(star => {
            star.rotation.y += star.userData.rotationSpeed;
            star.position.y += Math.sin(Date.now() * 0.003 + star.position.x) * 0.01;
        });
    }

    updatePowerUp(deltaTime) {
        if (this.powerUpActive) {
            this.powerUpTimer -= deltaTime;
            
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            } else {
                document.getElementById('powerupTimer').textContent = Math.ceil(this.powerUpTimer);
            }
        }
    }

    updateBoss(deltaTime) {
        // Boss logic will be added here
    }

    updateAdminFeatures(deltaTime) {
        // Admin feature updates (rainbow trail, path tracking, etc.)
    }

    updateCamera() {
        if (this.player) {
            const targetPosition = this.player.position.clone();
            targetPosition.add(new THREE.Vector3(-8, 6, 0));
            this.camera.position.lerp(targetPosition, 0.1);
            this.camera.lookAt(this.player.position);
        }
    }

    activatePowerUp() {
        this.powerUpActive = true;
        this.powerUpTimer = this.powerUpDuration;
        this.isFlying = true;
        
        if (this.powerUpObject) {
            this.powerUpObject.visible = false;
        }
        
        document.getElementById('powerupStatus').style.display = 'block';
        console.log("⚡ Claire is Awesome mode activated!");
    }

    deactivatePowerUp() {
        this.powerUpActive = false;
        this.isFlying = false;
        document.getElementById('powerupStatus').style.display = 'none';
        console.log("Power-up ended!");
    }

    takeDamage() {
        if (this.godMode) {
            console.log("👑 God Mode: Damage ignored!");
            return;
        }

        this.deathCount++;

        if (!this.infiniteLives) {
            this.lives--;
        }

        this.updateUI();

        if (this.lives <= 0 && !this.infiniteLives) {
            this.gameOver();
        } else {
            this.respawnPlayer();
        }
    }

    respawnPlayer() {
        this.player.position.copy(this.respawnPosition);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.jumpCount = 0;
        console.log("💔 Respawned! Be careful!");
    }

    updateUI() {
        document.getElementById('stars').textContent = `⭐ Stars: ${this.stars}`;
        document.getElementById('lives').textContent = `❤️ Lives: ${this.lives}`;
    }

    startBossFight() {
        console.log("🏟️ Starting boss fight...");
        // Boss fight logic will be implemented
    }

    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameMessage').style.display = 'block';
        document.getElementById('messageText').innerHTML = "💔 Game Over!<br>Don't give up! Claire believes in you!<br>Stars collected: " + this.stars;
    }

    // Admin API methods (same as main game)
    setGodMode(enabled) {
        this.godMode = enabled;
        console.log("👑 Embedded Game: God Mode", enabled ? "ON" : "OFF");
    }

    setInfiniteLives(enabled) {
        this.infiniteLives = enabled;
        console.log("👑 Embedded Game: Infinite Lives", enabled ? "ON" : "OFF");
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        console.log("👑 Embedded Game: Speed Multiplier", multiplier);
    }

    setJumpHeight(multiplier) {
        this.jumpMultiplier = multiplier;
        console.log("👑 Embedded Game: Jump Height", multiplier);
    }

    setStarCount(count) {
        this.stars = Math.max(0, count);
        this.updateUI();
        console.log("👑 Embedded Game: Star Count", count);
    }

    teleportPlayer(x, y, z) {
        if (this.player) {
            this.player.position.set(x, y, z);
            this.playerVelocity.set(0, 0, 0);
            console.log(`👑 Embedded Game: Teleported to (${x}, ${y}, ${z})`);
        }
    }

    setPhysicsEnabled(enabled) {
        this.physicsEnabled = enabled;
        if (!enabled) {
            this.playerVelocity.set(0, 0, 0);
        }
        console.log("👑 Embedded Game: Physics", enabled ? "ON" : "OFF");
    }

    setPaused(paused) {
        this.gamePaused = paused;
        console.log("👑 Embedded Game: Game", paused ? "PAUSED" : "RESUMED");
    }

    setWireframeMode(enabled) {
        this.scene.traverse((object) => {
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.wireframe = enabled);
                } else {
                    object.material.wireframe = enabled;
                }
            }
        });
        console.log("👑 Embedded Game: Wireframe Mode", enabled ? "ON" : "OFF");
    }

    // Additional admin methods would go here...
}

// Global functions for admin panel integration
function resetEmbeddedGame() {
    if (window.embeddedGame) {
        // Reset game state
        window.embeddedGame.lives = 3;
        window.embeddedGame.stars = 0;
        window.embeddedGame.gameState = 'playing';
        window.embeddedGame.deactivatePowerUp();
        window.embeddedGame.respawnPlayer();
        window.embeddedGame.updateUI();
        
        // Hide any game messages
        document.getElementById('gameMessage').style.display = 'none';
        
        console.log("🔄 Embedded game reset");
    }
}

function toggleGameFullscreen() {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            gameContainer.requestFullscreen();
        }
    }
}

// Initialize embedded game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure Three.js is loaded
    setTimeout(() => {
        window.embeddedGame = new EmbeddedClaireGame();
        
        // Make it available to admin system
        if (window.adminSystem) {
            window.adminSystem.gameInstance = window.embeddedGame;
            console.log("🔗 Embedded game connected to admin system");
        }
    }, 100);
});

// Export for admin panel
window.EmbeddedClaireGame = EmbeddedClaireGame; 