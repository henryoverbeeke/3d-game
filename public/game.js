// Claire's Adventure - 3D Platformer Game
class ClaireGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Game state
        this.gameState = 'playing'; // playing, boss, gameOver, victory
        this.stars = 0;
        this.lives = 3;
        this.respawnPosition = new THREE.Vector3(0, 1, 0);
        
        // Power-up state
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.powerUpDuration = 5; // Quick 5-second power-up
        
        // Boss state
        this.bossHealth = 100;
        this.bossMaxHealth = 100;
        this.bossAttackTimer = 0;
        this.bossAttackCooldown = 3; // Boss attacks every 3 seconds
        
        // Player health for boss fights
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        this.originalPlayer = null; // Store original player model
        this.playerBattleForm = null; // Blue cube battle form
        
        // Ability cooldowns and timers
        this.lastDaggerTime = 0;
        this.lastHealTime = 0;
        this.lastSonicTime = 0;
        this.daggerCooldown = 2;
        this.healCooldown = 8;
        this.sonicCooldown = 5;
        
        // Boss abilities
        this.bossLastAbilityTime = 0;
        this.bossAbilityCooldown = 4;
        
        // Battle effects
        this.battleEffects = [];
        this.endingCubes = [];
        
        // Teleport particles
        this.teleportParticles = [];
        this.returnParticles = [];
        
        // Mobile controls
        this.isMobile = this.detectMobile();
        this.joystickData = { x: 0, y: 0, active: false };
        this.mobileInputs = {
            jump: false,
            flyUp: false,
            flyDown: false
        };
        this.lastButtonPress = 0;
        this.buttonDebounceTime = 300; // 300ms debounce
        
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
        this.pPressed = false; // For power-up cheat
        this.ePressed = false; // For teleport cheat
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Game objects
        this.platforms = [];
        this.spikes = [];
        this.turtles = [];
        this.starObjects = [];
        this.powerUpObject = null;
        this.boss = null;
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLighting();
        
        // Create player
        this.createPlayer();
        
        // Create level
        this.createLevel();
        
        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Setup controls
        this.setupControls();
        
        // Setup mobile controls if on mobile
        if (this.isMobile) {
            this.setupMobileControls();
        }
        
        // Start game loop
        this.gameLoop();
        
        console.log("🎮 Claire's Adventure started! Collect stars and avoid hazards!");
        console.log("🛠️ DEV CONTROLS: Press 'P' for power-up, 'E' to teleport to end");
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }
    
    createPlayer() {
        // Create girl character (simplified)
        const group = new THREE.Group();
        
        // Body (using CylinderGeometry for compatibility)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        group.add(head);
        
        // Hair
        const hairGeometry = new THREE.SphereGeometry(0.28, 8, 8);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.3;
        hair.scale.y = 0.8;
        hair.castShadow = true;
        group.add(hair);
        
        group.position.copy(this.respawnPosition);
        this.scene.add(group);
        this.player = group;
    }
    
    createLevel() {
        // Create floating dirt platforms
        this.createPlatforms();
        
        // Create spikes
        this.createSpikes();
        
        // Create turtles (only 2 as requested)
        this.createTurtles();
        
        // Create stars
        this.createStars();
        
        // Create power-up
        this.createPowerUp();
        
        // Create ground plane
        this.createGround();
    }
    
    createPlatforms() {
        const platformGeometry = new THREE.BoxGeometry(2, 0.3, 2);
        const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        
        // Platform positions - now includes connected spike platforms
        const positions = [
            [0, 0, 0],      // Start platform
            [4, 1, 0],      // Platform 1
            [8, 2, -2],     // Platform 2
            [10, 2, -2],    // Connected dirt platform (spike setup 1a)
            [12, 2, -2],    // Connected dirt platform (spike setup 1b)
            [16, 4, 2],     // Platform 4
            [18, 4, 2],     // Connected dirt platform (spike setup 2a)
            [20, 4, 2],     // Connected dirt platform (spike setup 2b)
            [24, 6, -1],    // Platform 6
            [26, 6, -1],    // Connected dirt platform (spike setup 3a)
            [28, 6, -1],    // Connected dirt platform (spike setup 3b)
            [32, 8, 0],     // Platform 8
            [36, 9, 0],     // Boss platform
        ];
        
        positions.forEach(([x, y, z]) => {
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(x, y, z);
            platform.receiveShadow = true;
            platform.castShadow = true;
            this.scene.add(platform);
            this.platforms.push(platform);
        });
    }
    
    createSpikes() {
        const spikeGeometry = new THREE.ConeGeometry(0.3, 1, 4);
        const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        // Spike positions - on the middle platform of each 3-platform group
        // Each group: 2 normal dirt platforms + 1 spike platform (all connected)
        const spikeGroups = [
            // Group 1: platforms at [8,2,-2], [10,2,-2], [12,2,-2] - spikes on middle one
            { platform: [10, 2, -2], spikes: [[10, 2.8, -2], [9.5, 2.8, -1.5], [10.5, 2.8, -2.5]] },
            
            // Group 2: platforms at [16,4,2], [18,4,2], [20,4,2] - spikes on middle one  
            { platform: [18, 4, 2], spikes: [[18, 4.8, 2], [17.5, 4.8, 1.5], [18.5, 4.8, 2.5]] },
            
            // Group 3: platforms at [24,6,-1], [26,6,-1], [28,6,-1] - spikes on middle one
            { platform: [26, 6, -1], spikes: [[26, 6.8, -1], [25.5, 6.8, -0.5], [26.5, 6.8, -1.5]] },
        ];
        
        spikeGroups.forEach(group => {
            group.spikes.forEach(([x, y, z]) => {
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                spike.position.set(x, y, z);
                spike.castShadow = true;
                this.scene.add(spike);
                this.spikes.push(spike);
            });
        });
    }
    
    createTurtles() {
        // Only 2 turtles as requested
        for (let i = 0; i < 2; i++) {
            const turtle = this.createTurtle();
            const positions = [
                [10, 2.5, 0],
                [26, 6.5, -1]
            ];
            turtle.position.set(...positions[i]);
            turtle.direction = Math.random() > 0.5 ? 1 : -1;
            turtle.speed = 0.5;
            this.scene.add(turtle);
            this.turtles.push(turtle);
        }
    }
    
    createTurtle() {
        const group = new THREE.Group();
        
        // Shell
        const shellGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.scale.y = 0.6;
        shell.castShadow = true;
        group.add(shell);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.4, 0, 0);
        head.castShadow = true;
        group.add(head);
        
        return group;
    }
    
    createStars() {
        const starGeometry = new THREE.SphereGeometry(0.2, 5, 5);
        const starMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.3
        });
        
        // Star positions
        const starPositions = [
            [2, 2, 0],
            [6, 3, -1],
            [10, 4, 1],
            [14, 5, -1],
            [18, 6, 1],
            [22, 7, 0],
            [26, 8, -1],
            [30, 9, 1],
        ];
        
        starPositions.forEach(([x, y, z]) => {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.set(x, y, z);
            star.userData = { collected: false };
            this.scene.add(star);
            this.starObjects.push(star);
        });
    }
    
    createPowerUp() {
        // Create "Claire is Awesome" power-up
        const group = new THREE.Group();
        
        const powerUpGeometry = new THREE.OctahedronGeometry(0.4);
        const powerUpMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.5
        });
        const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        powerUp.castShadow = true;
        group.add(powerUp);
        
        group.position.set(18, 7, 0);
        group.userData = { collected: false };
        this.scene.add(group);
        this.powerUpObject = group;
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupControls() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mouse events for camera control
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Pointer lock for better camera control
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768) ||
               ('ontouchstart' in window);
    }
    
    setupMobileControls() {
        // Show mobile controls
        document.getElementById('mobileControls').style.display = 'block';
        
        // Setup virtual joystick
        this.setupVirtualJoystick();
        
        // Setup mobile buttons
        this.setupMobileButtons();
        
        console.log("📱 Mobile controls enabled!");
    }
    
    setupVirtualJoystick() {
        const joystick = document.getElementById('virtualJoystick');
        const knob = document.getElementById('joystickKnob');
        const joystickRect = joystick.getBoundingClientRect();
        const joystickCenter = {
            x: joystickRect.width / 2,
            y: joystickRect.height / 2
        };
        const maxDistance = 35; // Maximum distance knob can move from center
        
        let isDragging = false;
        
        const handleStart = (e) => {
            isDragging = true;
            this.joystickData.active = true;
            e.preventDefault();
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystick.getBoundingClientRect();
            const x = touch.clientX - rect.left - joystickCenter.x;
            const y = touch.clientY - rect.top - joystickCenter.y;
            
            const distance = Math.sqrt(x * x + y * y);
            const angle = Math.atan2(y, x);
            
            if (distance <= maxDistance) {
                knob.style.transform = `translate(${x}px, ${y}px)`;
                this.joystickData.x = x / maxDistance;
                this.joystickData.y = y / maxDistance;
            } else {
                const limitedX = Math.cos(angle) * maxDistance;
                const limitedY = Math.sin(angle) * maxDistance;
                knob.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
                this.joystickData.x = Math.cos(angle);
                this.joystickData.y = Math.sin(angle);
            }
        };
        
        const handleEnd = (e) => {
            isDragging = false;
            this.joystickData.active = false;
            this.joystickData.x = 0;
            this.joystickData.y = 0;
            knob.style.transform = 'translate(0px, 0px)';
            e.preventDefault();
        };
        
        // Touch events
        joystick.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd, { passive: false });
        
        // Mouse events for testing on desktop
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    setupMobileButtons() {
        // Jump button
        const jumpBtn = document.getElementById('jumpButton');
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileInputs.jump = true;
        });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileInputs.jump = false;
        });
        
        // Flying controls
        const flyUpBtn = document.getElementById('flyUpBtn');
        const flyDownBtn = document.getElementById('flyDownBtn');
        
        flyUpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileInputs.flyUp = true;
        });
        flyUpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileInputs.flyUp = false;
        });
        
        flyDownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobileInputs.flyDown = true;
        });
        flyDownBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobileInputs.flyDown = false;
        });
        
        // Boss fight buttons with better event handling
        this.setupMobileBossButton('mobileDaggerBtn', () => this.daggerLaunch(), 'dagger');
        this.setupMobileBossButton('mobileHealBtn', () => this.healPlayer(), 'heal');
        this.setupMobileBossButton('mobileSonicBtn', () => this.sonicBlast(), 'sonic');
        
        // Also add mouse events for desktop testing
        jumpBtn.addEventListener('mousedown', () => this.mobileInputs.jump = true);
        jumpBtn.addEventListener('mouseup', () => this.mobileInputs.jump = false);
        flyUpBtn.addEventListener('mousedown', () => this.mobileInputs.flyUp = true);
        flyUpBtn.addEventListener('mouseup', () => this.mobileInputs.flyUp = false);
        flyDownBtn.addEventListener('mousedown', () => this.mobileInputs.flyDown = true);
        flyDownBtn.addEventListener('mouseup', () => this.mobileInputs.flyDown = false);
    }
    
    setupMobileBossButton(buttonId, action, type) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.error(`Mobile button ${buttonId} not found`);
            return;
        }
        
        let touchStarted = false;
        let touchMoved = false;
        
        // Enhanced touch event handling
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchStarted = true;
            touchMoved = false;
            button.style.transform = 'scale(0.95)';
            console.log(`${type} button touch started`);
        }, { passive: false });
        
        button.addEventListener('touchmove', (e) => {
            e.preventDefault();
            touchMoved = true;
        }, { passive: false });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (touchStarted && !touchMoved) {
                // Only trigger if it was a tap, not a drag
                console.log(`${type} button activated - Game state: ${this.gameState}`);
                
                const currentTime = Date.now();
                const canPress = currentTime - this.lastButtonPress > this.buttonDebounceTime;
                
                if (this.gameState === 'boss' && !button.disabled && canPress) {
                    this.lastButtonPress = currentTime;
                    console.log(`Executing ${type} action`);
                    
                    // Add haptic feedback if available
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    
                    try {
                        action();
                    } catch (error) {
                        console.error(`Error executing ${type} action:`, error);
                    }
                } else {
                    console.log(`Button action blocked - boss: ${this.gameState === 'boss'}, disabled: ${button.disabled}, debounce: ${canPress}`);
                }
            }
            
            touchStarted = false;
            touchMoved = false;
            button.style.transform = 'scale(1)';
        }, { passive: false });
        
        button.addEventListener('touchcancel', (e) => {
            touchStarted = false;
            touchMoved = false;
            button.style.transform = 'scale(1)';
        });
        
        // Also add click event for desktop testing
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`${type} button clicked (desktop) - Game state: ${this.gameState}`);
            
            const currentTime = Date.now();
            const canPress = currentTime - this.lastButtonPress > this.buttonDebounceTime;
            
            if (this.gameState === 'boss' && !button.disabled && canPress) {
                this.lastButtonPress = currentTime;
                console.log(`Executing ${type} action (desktop)`);
                
                try {
                    action();
                } catch (error) {
                    console.error(`Error executing ${type} action (desktop):`, error);
                }
            } else {
                console.log(`Desktop button action blocked - boss: ${this.gameState === 'boss'}, disabled: ${button.disabled}, debounce: ${canPress}`);
            }
        });
        
        console.log(`Mobile boss button ${buttonId} (${type}) setup complete`);
    }
    
    // Debug function to check boss fight state
    debugBossFight() {
        console.log('=== BOSS FIGHT DEBUG ===');
        console.log('Game State:', this.gameState);
        console.log('Is Mobile:', this.isMobile);
        console.log('Boss Health:', this.bossHealth, '/', this.bossMaxHealth);
        console.log('Player Health:', this.playerHealth, '/', this.playerMaxHealth);
        
        const currentTime = Date.now() / 1000;
        console.log('Cooldowns:');
        console.log('- Dagger:', Math.max(0, this.daggerCooldown - (currentTime - this.lastDaggerTime)).toFixed(1) + 's');
        console.log('- Heal:', Math.max(0, this.healCooldown - (currentTime - this.lastHealTime)).toFixed(1) + 's');
        console.log('- Sonic:', Math.max(0, this.sonicCooldown - (currentTime - this.lastSonicTime)).toFixed(1) + 's');
        
        if (this.isMobile) {
            const buttons = ['mobileDaggerBtn', 'mobileHealBtn', 'mobileSonicBtn'];
            console.log('Mobile Button States:');
            buttons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    console.log(`- ${btnId}: disabled=${btn.disabled}, display=${btn.style.display || 'default'}`);
                } else {
                    console.log(`- ${btnId}: NOT FOUND`);
                }
            });
            
            const controls = document.getElementById('mobileBossControls');
            console.log('Mobile Boss Controls Display:', controls ? controls.style.display : 'NOT FOUND');
        }
        console.log('======================');
    }
    
    updatePlayer(deltaTime) {
        if (!this.player || this.gameState !== 'playing') return;
        
        const speed = 5;
        const jumpForce = 10;
        const gravity = -20;
        
        // Handle input (keyboard + mobile)
        const moveVector = new THREE.Vector3();
        
        // Keyboard input
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.x += 1;
        
        // Mobile joystick input
        if (this.isMobile && this.joystickData.active) {
            moveVector.x += this.joystickData.x;
            moveVector.z += this.joystickData.y; // Note: joystick Y maps to world Z
        }
        
        moveVector.normalize();
        moveVector.multiplyScalar(speed * deltaTime);
        
        // Apply movement
        this.player.position.add(moveVector);
        
        // Jumping with double jump (keyboard + mobile)
        const jumpPressed = this.keys['Space'] || this.mobileInputs.jump;
        const jumpJustPressed = jumpPressed && !this.spacePressed;
        
        if (jumpJustPressed) {
            if (this.isFlying) {
                // Flying mode
                this.playerVelocity.y = jumpForce;
                this.isGrounded = false;
            } else if (this.jumpCount < this.maxJumps) {
                // Normal jumping with double jump
                this.playerVelocity.y = jumpForce;
                this.jumpCount++;
                this.isGrounded = false;
                console.log(`Jump ${this.jumpCount}/${this.maxJumps}`);
            }
        }
        
        // Track jump state to prevent holding
        this.spacePressed = jumpPressed;
        
        // Development cheat keys
        if (this.keys['KeyP'] && !this.pPressed) {
            // Activate Claire is Awesome mode
            this.activatePowerUp();
            console.log("🌟 DEV: Claire is Awesome mode activated for 60 seconds!");
        }
        this.pPressed = this.keys['KeyP'];
        
        if (this.keys['KeyE'] && !this.ePressed) {
            // Teleport to end/boss area
            this.player.position.set(36, 10, 0); // Slightly past trigger point
            this.player.velocity.set(0, 0, 0);
            console.log("🚀 DEV: Teleported to boss area at x=36!");
        }
        this.ePressed = this.keys['KeyE'];
        
        // Apply gravity (unless flying)
        if (!this.isFlying) {
            this.playerVelocity.y += gravity * deltaTime;
        } else {
            // Flying controls - up, down, and hover (keyboard + mobile)
            const flyUpPressed = this.keys['Space'] || this.mobileInputs.flyUp;
            const flyDownPressed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mobileInputs.flyDown;
            
            if (flyUpPressed) {
                this.playerVelocity.y = 8; // Fly up
            } else if (flyDownPressed) {
                this.playerVelocity.y = -6; // Fly down
            } else {
                this.playerVelocity.y = 0; // Hover
            }
        }
        
        // Apply velocity
        this.player.position.y += this.playerVelocity.y * deltaTime;
        
        // Ground collision
        this.checkGroundCollision();
        
        // Platform collision
        this.checkPlatformCollision();
        
        // Check for hazards
        this.checkHazards();
        
        // Check collectibles
        this.checkCollectibles();
        
        // Update camera to follow player
        this.updateCamera();
        
        // Check if player fell off the world
        if (this.player.position.y < -10) {
            this.respawnPlayer();
        }
        
        // Check if player reached boss area
        if (this.player.position.x > 35 && this.gameState === 'playing') {
            console.log("🚪 Boss area reached! Starting boss fight...");
            console.log(`Player position: x=${this.player.position.x.toFixed(2)}, y=${this.player.position.y.toFixed(2)}, z=${this.player.position.z.toFixed(2)}`);
            this.showMessage("🌟 Entering Boss Arena! 🌟<br>✨ Teleporting... ✨", 3000);
            this.startBossFight();
        }
    }
    
    checkGroundCollision() {
        if (this.player.position.y <= 0.5) {
            this.player.position.y = 0.5;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            this.jumpCount = 0; // Reset jumps when landing
        }
    }
    
    checkPlatformCollision() {
        let onPlatform = false;
        
        this.platforms.forEach(platform => {
            const platformBox = new THREE.Box3().setFromObject(platform);
            const playerBox = new THREE.Box3().setFromObject(this.player);
            
            // Create a slightly expanded platform box for better collision detection
            const expandedPlatformBox = platformBox.clone();
            expandedPlatformBox.expandByScalar(0.1);
            
            if (expandedPlatformBox.intersectsBox(playerBox)) {
                // Check if player is falling onto platform from above
                const playerBottom = this.player.position.y - 0.5; // Player height offset
                const platformTop = platform.position.y + 0.15; // Platform top surface
                
                // Player is falling down and close to platform top
                if (this.playerVelocity.y <= 0 && 
                    playerBottom <= platformTop && 
                    playerBottom >= platformTop - 1) {
                    
                    // Check if player is within platform X and Z bounds
                    const playerPos = this.player.position;
                    const platformPos = platform.position;
                    const platformSize = 2; // Platform is 2x2
                    
                    if (Math.abs(playerPos.x - platformPos.x) <= platformSize/2 + 0.5 &&
                        Math.abs(playerPos.z - platformPos.z) <= platformSize/2 + 0.5) {
                        
                        this.player.position.y = platformTop + 0.5;
                        this.playerVelocity.y = 0;
                        this.isGrounded = true;
                        this.jumpCount = 0; // Reset jumps when landing on platform
                        onPlatform = true;
                    }
                }
            }
        });
        
        // If not on any platform and not on ground, player is in air
        if (!onPlatform && this.player.position.y > 0.5) {
            this.isGrounded = false;
        }
    }
    
    checkHazards() {
        if (this.powerUpActive) return; // Invincible!
        
        // Check spikes
        this.spikes.forEach(spike => {
            const distance = this.player.position.distanceTo(spike.position);
            if (distance < 0.8) {
                this.takeDamage();
            }
        });
        
        // Check turtles
        this.turtles.forEach(turtle => {
            const distance = this.player.position.distanceTo(turtle.position);
            if (distance < 0.8) {
                this.takeDamage();
            }
        });
    }
    
    checkCollectibles() {
        // Check stars
        this.starObjects.forEach(star => {
            if (!star.userData.collected) {
                const distance = this.player.position.distanceTo(star.position);
                if (distance < 0.8) {
                    star.userData.collected = true;
                    star.visible = false;
                    this.stars++;
                    this.updateUI();
                    console.log(`⭐ Star collected! Total: ${this.stars}`);
                }
            }
        });
        
        // Check power-up
        if (this.powerUpObject && !this.powerUpObject.userData.collected) {
            const distance = this.player.position.distanceTo(this.powerUpObject.position);
            if (distance < 0.8) {
                this.activatePowerUp();
            }
        }
    }
    
    activatePowerUp() {
        // Hide power-up object if it exists
        if (this.powerUpObject) {
            this.powerUpObject.userData.collected = true;
            this.powerUpObject.visible = false;
        }
        
        this.powerUpActive = true;
        this.powerUpTimer = this.powerUpDuration;
        this.isFlying = true;
        
        // Visual effect - make player glow
        this.player.children.forEach(child => {
            if (child.material) {
                child.material.emissive = new THREE.Color(0xffd700);
                child.material.emissiveIntensity = 0.5;
            }
        });
        
        document.getElementById('powerupStatus').style.display = 'block';
        document.getElementById('powerupTimer').textContent = Math.ceil(this.powerUpTimer);
        
        // Show mobile flying controls if on mobile
        if (this.isMobile) {
            document.getElementById('flyControls').style.display = 'flex';
        }
        
        console.log("🌟 CLAIRE IS AWESOME! Power-up activated for 60 seconds!");
    }
    
    updatePowerUp(deltaTime) {
        if (!this.powerUpActive) return;
        
        this.powerUpTimer -= deltaTime;
        document.getElementById('powerupTimer').textContent = Math.ceil(this.powerUpTimer);
        
        if (this.powerUpTimer <= 0) {
            this.deactivatePowerUp();
        }
    }
    
    deactivatePowerUp() {
        this.powerUpActive = false;
        this.isFlying = false;
        
        // Remove glow effect
        this.player.children.forEach(child => {
            if (child.material) {
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
            }
        });
        
        document.getElementById('powerupStatus').style.display = 'none';
        
        // Hide mobile flying controls if on mobile
        if (this.isMobile) {
            document.getElementById('flyControls').style.display = 'none';
        }
        
        console.log("Power-up ended!");
    }
    
    takeDamage() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.respawnPlayer();
        }
    }
    
    respawnPlayer() {
        this.player.position.copy(this.respawnPosition);
        this.playerVelocity.set(0, 0, 0);
        this.isGrounded = true;
        this.jumpCount = 0; // Reset jumps on respawn
        console.log("💔 Respawned! Be careful!");
    }
    
    updateTurtles(deltaTime) {
        this.turtles.forEach(turtle => {
            // Move turtle back and forth
            turtle.position.x += turtle.direction * turtle.speed * deltaTime;
            
            // Change direction occasionally
            if (Math.random() < 0.01) {
                turtle.direction *= -1;
            }
            
            // Rotate slightly for animation
            turtle.rotation.y += deltaTime;
        });
    }
    
    animateCollectibles(deltaTime) {
        // Rotate stars
        this.starObjects.forEach(star => {
            if (!star.userData.collected) {
                star.rotation.y += deltaTime * 2;
                star.position.y += Math.sin(Date.now() * 0.005) * 0.01;
            }
        });
        
        // Animate power-up
        if (this.powerUpObject && !this.powerUpObject.userData.collected) {
            this.powerUpObject.rotation.y += deltaTime * 3;
            this.powerUpObject.rotation.x += deltaTime * 2;
            this.powerUpObject.position.y += Math.sin(Date.now() * 0.003) * 0.02;
        }
    }
    
    updateCamera() {
        // Follow player with smooth camera
        const targetPosition = new THREE.Vector3(
            this.player.position.x - 5,
            this.player.position.y + 3,
            this.player.position.z + 8
        );
        
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.player.position);
    }
    
    startBossFight() {
        this.gameState = 'bossPrep'; // Preparation phase
        this.playerHealth = this.playerMaxHealth; // Reset player health for boss fight
        
        // Teleport player to arena
        this.teleportToArena();
        
        // Create boss but make it inactive initially
        this.createBoss();
        this.boss.visible = false; // Hide boss during prep
        
        // Transform player immediately
        this.transformPlayerToBattleForm();
        
        // Show boss fight UI immediately
        this.showBossFightUI();
        
        // Force update mobile controls to ensure they work
        this.refreshMobileControls();
        
        // Start 4-second preparation phase
        this.startBossPreparation();
        
        console.log("🏟️ Teleported to arena! Preparing for boss battle...");
    }
    
    teleportToArena() {
        // Create arena environment first
        this.createArena();
        
        // Start teleport animation
        this.startTeleportAnimation().then(() => {
            // Arena coordinates
            const arenaX = 50; // Further from normal game area
            const arenaY = 15; // Higher up
            const arenaZ = 0;
            
            // Teleport player after animation
            if (this.player) {
                this.player.position.set(arenaX, arenaY, arenaZ);
                this.player.velocity.set(0, 0, 0); // Stop any movement
            }
            
            // End teleport animation
            this.endTeleportAnimation();
            
            console.log(`🎯 Player teleported to arena at (${arenaX}, ${arenaY}, ${arenaZ})`);
        });
    }
    
    async startTeleportAnimation() {
        return new Promise((resolve) => {
            try {
                if (!this.player) {
                    console.log("❌ No player found for teleport animation");
                    resolve();
                    return;
                }
                
                console.log("✨ Starting teleport animation...");
                
                // Create teleport particles around player
                this.createTeleportParticles(this.player.position);
                
                // Screen flash effect
                this.createScreenFlash();
                
                // Player spinning/shrinking effect
                this.animatePlayerTeleportOut(() => {
                    console.log("✅ Teleport out animation complete");
                    resolve();
                });
            } catch (error) {
                console.error("❌ Error in teleport animation:", error);
                resolve(); // Continue anyway
            }
        });
    }
    
    createTeleportParticles(position) {
        const particleCount = 20;
        this.teleportParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                emissive: 0x0088ff,
                emissiveIntensity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around player
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1 + Math.random() * 2;
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 3,
                position.z + Math.sin(angle) * radius
            );
            
            // Store animation data
            particle.userData = {
                startTime: Date.now(),
                duration: 2000,
                initialPos: particle.position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.1
                )
            };
            
            this.scene.add(particle);
            this.teleportParticles.push(particle);
        }
    }
    
    createScreenFlash() {
        // Create a full-screen flash effect
        const flashDiv = document.createElement('div');
        flashDiv.style.position = 'fixed';
        flashDiv.style.top = '0';
        flashDiv.style.left = '0';
        flashDiv.style.width = '100%';
        flashDiv.style.height = '100%';
        flashDiv.style.backgroundColor = 'cyan';
        flashDiv.style.opacity = '0';
        flashDiv.style.pointerEvents = 'none';
        flashDiv.style.zIndex = '9999';
        flashDiv.style.transition = 'opacity 0.3s ease';
        
        document.body.appendChild(flashDiv);
        
        // Flash animation
        setTimeout(() => {
            flashDiv.style.opacity = '0.7';
        }, 100);
        
        setTimeout(() => {
            flashDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flashDiv);
            }, 300);
        }, 800);
    }
    
    animatePlayerTeleportOut(callback) {
        if (!this.player) {
            callback();
            return;
        }
        
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds
        const originalScale = this.player.scale.clone();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (this.player) {
                // Spinning effect
                this.player.rotation.y += 0.3;
                this.player.rotation.x += 0.2;
                
                // Shrinking effect (but keep visible)
                const scale = originalScale.clone().multiplyScalar(1 - progress * 0.5);
                this.player.scale.copy(scale);
                
                // Floating upward
                this.player.position.y += 0.05;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Reset player appearance for arena
                if (this.player) {
                    this.player.scale.copy(originalScale);
                    this.player.rotation.set(0, 0, 0);
                }
                callback();
            }
        };
        
        animate();
    }
    
    endTeleportAnimation() {
        // Clean up teleport particles
        if (this.teleportParticles) {
            this.teleportParticles.forEach(particle => {
                this.scene.remove(particle);
            });
            this.teleportParticles = [];
        }
        
        // Player appear animation in arena
        if (this.player) {
            this.player.scale.set(0.1, 0.1, 0.1);
            this.animatePlayerTeleportIn();
        }
        
        console.log("✨ Teleport animation complete!");
    }
    
    animatePlayerTeleportIn() {
        if (!this.player) return;
        
        const startTime = Date.now();
        const duration = 800;
        const targetScale = new THREE.Vector3(1, 1, 1);
        
        // Create arrival particles
        this.createTeleportParticles(this.player.position);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (this.player) {
                // Growing effect
                const scale = progress * progress; // Ease-in
                this.player.scale.set(scale, scale, scale);
                
                // Slight rotation
                this.player.rotation.y = (1 - progress) * Math.PI * 2;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final cleanup
                if (this.player) {
                    this.player.scale.copy(targetScale);
                    this.player.rotation.set(0, 0, 0);
                }
                
                // Clean up arrival particles after delay
                setTimeout(() => {
                    if (this.teleportParticles) {
                        this.teleportParticles.forEach(particle => {
                            this.scene.remove(particle);
                        });
                        this.teleportParticles = [];
                    }
                }, 1000);
            }
        };
        
        animate();
    }
    
    createArena() {
        try {
            // Create a large circular arena platform
            const arenaGeometry = new THREE.CylinderGeometry(20, 20, 2, 32);
            const arenaMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x444444,
                emissive: 0x222222,
                emissiveIntensity: 0.2
            });
            this.arenaPlatform = new THREE.Mesh(arenaGeometry, arenaMaterial);
            this.arenaPlatform.position.set(50, 10, 0);
            this.arenaPlatform.receiveShadow = true;
            this.scene.add(this.arenaPlatform);
            
            // Add some arena lighting effects
            this.arenaLight = new THREE.PointLight(0xff6600, 1, 50);
            this.arenaLight.position.set(50, 25, 0);
            this.scene.add(this.arenaLight);
            
            console.log("🏛️ Arena created successfully!");
            console.log(`Arena platform at: (50, 10, 0)`);
            console.log(`Arena light at: (50, 25, 0)`);
        } catch (error) {
            console.error("❌ Error creating arena:", error);
        }
    }
    
    showBossFightUI() {
        // Show boss fight UI
        document.getElementById('bossHealthBar').style.display = 'block';
        document.getElementById('playerHealthBar').style.display = 'block';
        document.getElementById('bossControls').style.display = 'flex';
        
        // Show mobile boss controls if on mobile
        if (this.isMobile) {
            const mobileControls = document.getElementById('mobileBossControls');
            if (mobileControls) {
                mobileControls.style.display = 'flex';
                console.log('Mobile boss controls shown');
            } else {
                console.error('Mobile boss controls element not found!');
            }
        }
        
        // Update health bars
        this.updatePlayerHealthBar();
        this.updateAbilityButtons();
    }
    
    refreshMobileControls() {
        // Re-initialize mobile controls to ensure they work immediately
        if (this.isMobile) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                console.log('🔄 Refreshing mobile controls...');
                
                // Re-setup boss buttons with fresh event listeners
                this.setupMobileBossButton('mobileDaggerBtn', () => this.daggerLaunch(), 'dagger');
                this.setupMobileBossButton('mobileHealBtn', () => this.healPlayer(), 'heal');
                this.setupMobileBossButton('mobileSonicBtn', () => this.sonicBlast(), 'sonic');
                
                console.log('✅ Mobile controls refreshed and ready!');
            }, 100);
        }
    }
    
    startBossPreparation() {
        let countdown = 4;
        
        this.showMessage(`🏟️ ARENA BATTLE INCOMING!<br>Powers ready in: ${countdown} seconds`);
        
        const prepInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.showMessage(`🏟️ ARENA BATTLE INCOMING!<br>Powers ready in: ${countdown} seconds`);
            } else {
                clearInterval(prepInterval);
                this.startActualBossFight();
            }
        }, 1000);
    }
    
    startActualBossFight() {
        this.gameState = 'boss'; // Now actually start the boss fight
        
        // Show the boss
        if (this.boss) {
            this.boss.visible = true;
        }
        
        // Clear preparation message
        this.hideMessage();
        
        this.showMessage("🔮 BOSS BATTLE! Use your mystical abilities!", 2000);
        
        console.log("🔥 BOSS FIGHT STARTED! Powers are fully active!");
    }
    
    cleanupArena() {
        try {
            // Remove arena platform
            if (this.arenaPlatform) {
                this.scene.remove(this.arenaPlatform);
                this.arenaPlatform = null;
                console.log("🏛️ Arena platform removed");
            }
            
            // Remove boss
            if (this.boss) {
                this.scene.remove(this.boss);
                this.boss = null;
                console.log("👾 Boss removed");
            }
            
            // Remove arena lighting
            if (this.arenaLight) {
                this.scene.remove(this.arenaLight);
                this.arenaLight = null;
                console.log("💡 Arena light removed");
            }
            
            // Clean up any remaining teleport particles
            if (this.teleportParticles && this.teleportParticles.length > 0) {
                this.teleportParticles.forEach(particle => {
                    this.scene.remove(particle);
                });
                this.teleportParticles = [];
                console.log("✨ Teleport particles cleaned up");
            }
            
            if (this.returnParticles && this.returnParticles.length > 0) {
                this.returnParticles.forEach(particle => {
                    this.scene.remove(particle);
                });
                this.returnParticles = [];
                console.log("🌟 Return particles cleaned up");
            }
            
            console.log("🧹 Arena cleaned up successfully!");
        } catch (error) {
            console.error("❌ Error cleaning up arena:", error);
        }
    }
    
    teleportBackToGame() {
        // Start teleport back animation
        this.startTeleportBackAnimation().then(() => {
            // Restore original player form first
            this.restorePlayerForm();
            
            // Teleport back to spawn area
            if (this.player) {
                this.player.position.set(0, 3, 0); // Back to spawn
                this.player.velocity.set(0, 0, 0); // Stop movement
            }
            
            // End teleport animation
            this.endTeleportBackAnimation();
            
            console.log("🚪 Teleported back to main game area!");
        });
    }
    
    async startTeleportBackAnimation() {
        return new Promise((resolve) => {
            try {
                const currentPlayer = this.playerBattleForm || this.player;
                if (!currentPlayer) {
                    console.log("❌ No player found for teleport back animation");
                    resolve();
                    return;
                }
                
                console.log("🌀 Starting teleport back animation...");
                
                // Create teleport particles around current player
                this.createTeleportParticles(currentPlayer.position);
                
                // Screen flash effect (purple for return)
                this.createReturnScreenFlash();
                
                // Player spinning/shrinking effect
                this.animatePlayerTeleportOut(() => {
                    console.log("✅ Teleport back animation complete");
                    resolve();
                });
            } catch (error) {
                console.error("❌ Error in teleport back animation:", error);
                resolve(); // Continue anyway
            }
        });
    }
    
    createReturnScreenFlash() {
        // Create a full-screen flash effect with purple color
        const flashDiv = document.createElement('div');
        flashDiv.style.position = 'fixed';
        flashDiv.style.top = '0';
        flashDiv.style.left = '0';
        flashDiv.style.width = '100%';
        flashDiv.style.height = '100%';
        flashDiv.style.backgroundColor = 'purple';
        flashDiv.style.opacity = '0';
        flashDiv.style.pointerEvents = 'none';
        flashDiv.style.zIndex = '9999';
        flashDiv.style.transition = 'opacity 0.3s ease';
        
        document.body.appendChild(flashDiv);
        
        // Flash animation
        setTimeout(() => {
            flashDiv.style.opacity = '0.6';
        }, 100);
        
        setTimeout(() => {
            flashDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flashDiv);
            }, 300);
        }, 800);
    }
    
    endTeleportBackAnimation() {
        // Clean up teleport particles
        if (this.teleportParticles) {
            this.teleportParticles.forEach(particle => {
                this.scene.remove(particle);
            });
            this.teleportParticles = [];
        }
        
        // Player appear animation back in main area
        if (this.player) {
            this.player.scale.set(0.1, 0.1, 0.1);
            this.animatePlayerReturnIn();
        }
        
        console.log("🏠 Return teleport animation complete!");
    }
    
    animatePlayerReturnIn() {
        if (!this.player) return;
        
        const startTime = Date.now();
        const duration = 800;
        const targetScale = new THREE.Vector3(1, 1, 1);
        
        // Create arrival particles with green color
        this.createReturnParticles(this.player.position);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (this.player) {
                // Growing effect
                const scale = progress * progress; // Ease-in
                this.player.scale.set(scale, scale, scale);
                
                // Slight rotation
                this.player.rotation.y = (1 - progress) * Math.PI * 2;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final cleanup
                if (this.player) {
                    this.player.scale.copy(targetScale);
                    this.player.rotation.set(0, 0, 0);
                }
                
                // Clean up arrival particles after delay
                setTimeout(() => {
                    if (this.returnParticles) {
                        this.returnParticles.forEach(particle => {
                            this.scene.remove(particle);
                        });
                        this.returnParticles = [];
                    }
                }, 1000);
            }
        };
        
        animate();
    }
    
    createReturnParticles(position) {
        const particleCount = 15;
        this.returnParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                emissive: 0x008800,
                emissiveIntensity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around player
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1 + Math.random() * 2;
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 3,
                position.z + Math.sin(angle) * radius
            );
            
            this.scene.add(particle);
            this.returnParticles.push(particle);
        }
    }
    
    transformPlayerToBattleForm() {
        // Store original player
        this.originalPlayer = this.player;
        this.originalPlayer.visible = false;
        
        // Create blue cube battle form
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4444ff,
            emissive: 0x2222ff,
            emissiveIntensity: 0.3
        });
        this.playerBattleForm = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.playerBattleForm.position.copy(this.originalPlayer.position);
        this.playerBattleForm.position.y += 2; // Float above ground
        this.playerBattleForm.castShadow = true;
        this.scene.add(this.playerBattleForm);
        
        console.log("✨ Player transformed into mystical battle form!");
    }
    
    createBoss() {
        const bossGeometry = new THREE.BoxGeometry(3, 3, 3);
        const bossMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8b0000,
            emissive: 0x8b0000,
            emissiveIntensity: 0.3
        });
        this.boss = new THREE.Mesh(bossGeometry, bossMaterial);
        // Position boss in the arena, opposite side from player
        this.boss.position.set(60, 15, 0); // Across from player spawn
        this.boss.castShadow = true;
        this.scene.add(this.boss);
        
        console.log("👾 Boss created in arena!");
    }
    
    updateBoss(deltaTime) {
        // Update during both prep and actual boss fight
        if (!this.boss || (this.gameState !== 'boss' && this.gameState !== 'bossPrep')) return;
        
        // Boss AI - movement and visual effects (only if visible)
        if (this.boss.visible) {
            this.boss.rotation.y += deltaTime * 2;
            this.boss.position.y += Math.sin(Date.now() * 0.003) * 0.1;
        }
        
        // Update player battle form movement
        if (this.playerBattleForm) {
            this.playerBattleForm.rotation.x += deltaTime;
            this.playerBattleForm.rotation.z += deltaTime * 0.5;
            this.playerBattleForm.position.y += Math.sin(Date.now() * 0.004) * 0.05;
        }
        
        // Boss attacks only during actual fight, not prep phase
        if (this.gameState === 'boss') {
            // Boss ability timer
            this.bossAttackTimer += deltaTime;
            
            // Boss uses abilities periodically
            if (this.bossAttackTimer >= this.bossAttackCooldown) {
                this.bossUseAbility();
                this.bossAttackTimer = 0;
            }
        }
        
        // Update battle effects
        this.updateBattleEffects(deltaTime);
        
        // Update button cooldowns
        this.updateAbilityButtons();
    }
    
    damageBoss(damage) {
        this.bossHealth -= damage;
        this.bossHealth = Math.max(0, this.bossHealth);
        
        // Update health bar
        const percentage = (this.bossHealth / this.bossMaxHealth) * 100;
        document.getElementById('bossHealth').style.width = percentage + '%';
        
        // Boss defeated
        if (this.bossHealth <= 0) {
            this.victory();
        }
        
        console.log(`Boss hit! Health: ${this.bossHealth}/${this.bossMaxHealth}`);
    }
    
    // PLAYER ABILITIES
    daggerLaunch() {
        // Allow powers during prep phase and boss fight
        if (this.gameState !== 'bossPrep' && this.gameState !== 'boss') {
            console.log("⚠️ Powers only work in boss arena!");
            return;
        }
        
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastDaggerTime < this.daggerCooldown) {
            console.log("⏰ Dagger on cooldown!");
            return;
        }
        
        this.lastDaggerTime = currentTime;
        this.createDaggerAnimation();
        
        // Only damage boss if fight has actually started
        if (this.gameState === 'boss') {
            const damage = 25;
            this.damageBoss(damage);
        }
        
        console.log("🗡️ Dagger launched!");
    }
    
    healPlayer() {
        // Allow powers during prep phase and boss fight
        if (this.gameState !== 'bossPrep' && this.gameState !== 'boss') {
            console.log("⚠️ Powers only work in boss arena!");
            return;
        }
        
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastHealTime < this.healCooldown) {
            console.log("⏰ Heal on cooldown!");
            return;
        }
        
        if (this.playerHealth >= this.playerMaxHealth) {
            console.log("💚 Already at full health!");
            return;
        }
        
        this.lastHealTime = currentTime;
        this.createHealAnimation();
        this.playerHealth += 40;
        this.playerHealth = Math.min(this.playerHealth, this.playerMaxHealth);
        this.updatePlayerHealthBar();
        console.log("💚 Healed! Health restored!");
    }
    
    sonicBlast() {
        // Allow powers during prep phase and boss fight
        if (this.gameState !== 'bossPrep' && this.gameState !== 'boss') {
            console.log("⚠️ Powers only work in boss arena!");
            return;
        }
        
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastSonicTime < this.sonicCooldown) {
            console.log("⏰ Sonic blast on cooldown!");
            return;
        }
        
        this.lastSonicTime = currentTime;
        this.createSonicAnimation();
        this.flashPlayerSonic(); // Add visual feedback for player
        this.cameraShake(); // Add screen shake for impact
        
        // Only damage boss if fight has actually started
        if (this.gameState === 'boss') {
            const damage = 35;
            this.damageBoss(damage);
        }
        
        console.log("💥 SONIC BLAST!");
    }
    
    flashPlayerSonic() {
        if (this.playerBattleForm) {
            // Flash bright purple/pink for sonic blast
            this.playerBattleForm.material.emissive = new THREE.Color(0xff00ff);
            this.playerBattleForm.material.emissiveIntensity = 1.2;
            
            // Temporarily make player bigger for impact
            this.playerBattleForm.scale.set(1.3, 1.3, 1.3);
            
            setTimeout(() => {
                if (this.playerBattleForm && this.playerBattleForm.material) {
                    this.playerBattleForm.material.emissive = new THREE.Color(0x2222ff);
                    this.playerBattleForm.material.emissiveIntensity = 0.3;
                    this.playerBattleForm.scale.set(1, 1, 1);
                }
            }, 400);
        }
    }
    
    cameraShake() {
        // Store original camera position
        const originalPosition = this.camera.position.clone();
        let shakeCount = 0;
        const maxShakes = 8;
        const shakeIntensity = 0.3;
        
        const shake = () => {
            if (shakeCount < maxShakes) {
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
                shakeCount++;
                setTimeout(shake, 50);
            } else {
                // Restore original position
                this.camera.position.copy(originalPosition);
            }
        };
        
        shake();
    }
    
    // BOSS ABILITIES
    bossUseAbility() {
        const abilities = ['laser', 'missile', 'heal'];
        const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
        
        switch(randomAbility) {
            case 'laser':
                this.bossLaserBeam();
                break;
            case 'missile':
                this.bossMissileLaunch();
                break;
            case 'heal':
                this.bossHeal();
                break;
        }
    }
    
    bossLaserBeam() {
        this.createLaserAnimation();
        const damage = 20;
        this.playerHealth -= damage;
        this.playerHealth = Math.max(0, this.playerHealth);
        this.updatePlayerHealthBar();
        this.flashPlayerDamage();
        console.log("🔴 Boss fires laser beam!");
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    bossMissileLaunch() {
        this.createMissileAnimation();
        const damage = 25;
        this.playerHealth -= damage;
        this.playerHealth = Math.max(0, this.playerHealth);
        this.updatePlayerHealthBar();
        this.flashPlayerDamage();
        console.log("🚀 Boss launches missile!");
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    bossHeal() {
        if (this.bossHealth >= this.bossMaxHealth) {
            this.bossLaserBeam(); // Use different ability if already full health
            return;
        }
        
        this.createBossHealAnimation();
        this.bossHealth += 30;
        this.bossHealth = Math.min(this.bossHealth, this.bossMaxHealth);
        
        // Update health bar
        const percentage = (this.bossHealth / this.bossMaxHealth) * 100;
        document.getElementById('bossHealth').style.width = percentage + '%';
        
        console.log("🟢 Boss heals itself!");
    }
    
    flashPlayerDamage() {
        if (this.playerBattleForm) {
            this.playerBattleForm.material.emissive = new THREE.Color(0xff0000);
            this.playerBattleForm.material.emissiveIntensity = 0.8;
            setTimeout(() => {
                if (this.playerBattleForm && this.playerBattleForm.material) {
                    this.playerBattleForm.material.emissive = new THREE.Color(0x2222ff);
                    this.playerBattleForm.material.emissiveIntensity = 0.3;
                }
            }, 300);
        }
    }
    
    updatePlayerHealthBar() {
        const percentage = (this.playerHealth / this.playerMaxHealth) * 100;
        document.getElementById('playerHealth').style.width = percentage + '%';
    }
    
    updateAbilityButtons() {
        const currentTime = Date.now() / 1000;
        
        // Dagger button
        const daggerBtn = document.getElementById('daggerBtn');
        const daggerTimeLeft = this.daggerCooldown - (currentTime - this.lastDaggerTime);
        if (daggerTimeLeft > 0) {
            daggerBtn.disabled = true;
            daggerBtn.textContent = `🗡️ Dagger (${Math.ceil(daggerTimeLeft)}s)`;
        } else {
            daggerBtn.disabled = false;
            daggerBtn.textContent = "🗡️ Dagger Launch";
        }
        
        // Heal button
        const healBtn = document.getElementById('healBtn');
        const healTimeLeft = this.healCooldown - (currentTime - this.lastHealTime);
        if (healTimeLeft > 0) {
            healBtn.disabled = true;
            healBtn.textContent = `💚 Heal (${Math.ceil(healTimeLeft)}s)`;
        } else if (this.playerHealth >= this.playerMaxHealth) {
            healBtn.disabled = true;
            healBtn.textContent = "💚 Full Health";
        } else {
            healBtn.disabled = false;
            healBtn.textContent = "💚 Heal";
        }
        
        // Sonic button
        const sonicBtn = document.getElementById('sonicBtn');
        const sonicTimeLeft = this.sonicCooldown - (currentTime - this.lastSonicTime);
        if (sonicTimeLeft > 0) {
            sonicBtn.disabled = true;
            sonicBtn.textContent = `💥 Sonic (${Math.ceil(sonicTimeLeft)}s)`;
        } else {
            sonicBtn.disabled = false;
            sonicBtn.textContent = "💥 Sonic Blast";
        }
        
        // Update mobile boss buttons if on mobile
        if (this.isMobile) {
            this.updateMobileBossButtons(currentTime);
        }
    }
    
    updateMobileBossButtons(currentTime) {
        // Mobile Dagger button
        const mobileDaggerBtn = document.getElementById('mobileDaggerBtn');
        if (mobileDaggerBtn) {
            const daggerTimeLeft = this.daggerCooldown - (currentTime - this.lastDaggerTime);
            if (daggerTimeLeft > 0) {
                mobileDaggerBtn.disabled = true;
                mobileDaggerBtn.classList.add('disabled');
                mobileDaggerBtn.innerHTML = `🗡️<span class="button-text">${Math.ceil(daggerTimeLeft)}s</span>`;
            } else {
                mobileDaggerBtn.disabled = false;
                mobileDaggerBtn.classList.remove('disabled');
                mobileDaggerBtn.innerHTML = `🗡️<span class="button-text">DAGGER</span>`;
            }
        }
        
        // Mobile Heal button
        const mobileHealBtn = document.getElementById('mobileHealBtn');
        if (mobileHealBtn) {
            const healTimeLeft = this.healCooldown - (currentTime - this.lastHealTime);
            if (healTimeLeft > 0) {
                mobileHealBtn.disabled = true;
                mobileHealBtn.classList.add('disabled');
                mobileHealBtn.innerHTML = `💚<span class="button-text">${Math.ceil(healTimeLeft)}s</span>`;
            } else if (this.playerHealth >= this.playerMaxHealth) {
                mobileHealBtn.disabled = true;
                mobileHealBtn.classList.add('disabled');
                mobileHealBtn.innerHTML = `💚<span class="button-text">FULL</span>`;
            } else {
                mobileHealBtn.disabled = false;
                mobileHealBtn.classList.remove('disabled');
                mobileHealBtn.innerHTML = `💚<span class="button-text">HEAL</span>`;
            }
        }
        
        // Mobile Sonic button
        const mobileSonicBtn = document.getElementById('mobileSonicBtn');
        if (mobileSonicBtn) {
            const sonicTimeLeft = this.sonicCooldown - (currentTime - this.lastSonicTime);
            if (sonicTimeLeft > 0) {
                mobileSonicBtn.disabled = true;
                mobileSonicBtn.classList.add('disabled');
                mobileSonicBtn.innerHTML = `💥<span class="button-text">${Math.ceil(sonicTimeLeft)}s</span>`;
            } else {
                mobileSonicBtn.disabled = false;
                mobileSonicBtn.classList.remove('disabled');
                mobileSonicBtn.innerHTML = `💥<span class="button-text">SONIC</span>`;
            }
        }
    }
    
    victory() {
        this.gameState = 'victory';
        this.createEndingCubes();
        this.showMessage("🎉 VICTORY! 🎉<br>Claire is awesome and saved the day!<br>You collected " + this.stars + " stars!");
        
        // Hide boss fight UI
        document.getElementById('bossHealthBar').style.display = 'none';
        document.getElementById('playerHealthBar').style.display = 'none';
        document.getElementById('bossControls').style.display = 'none';
        
        // Hide mobile boss controls if on mobile
        if (this.isMobile) {
            document.getElementById('mobileBossControls').style.display = 'none';
        }
        
        // Clean up arena after a brief delay for ending animation
        setTimeout(() => {
            this.cleanupArena();
            this.teleportBackToGame();
        }, 5000);
        
        console.log("🎉 VICTORY! Claire saved the day!");
    }
    
    createEndingCubes() {
        // Create 4 smaller cubes that circle around boss and player
        for (let i = 0; i < 4; i++) {
            const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const cubeMaterial = new THREE.MeshLambertMaterial({
                color: 0xffd700,
                emissive: 0xffaa00,
                emissiveIntensity: 0.4
            });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.userData = { 
                angle: (i * Math.PI * 2) / 4, 
                radius: 5,
                speed: 1
            };
            this.scene.add(cube);
            this.endingCubes.push(cube);
        }
        
        // Animate ending cubes
        this.animateEndingCubes();
    }
    
    animateEndingCubes() {
        if (this.endingCubes.length === 0) return;
        
        this.endingCubes.forEach(cube => {
            cube.userData.angle += 0.02;
            
            // Circle around the middle point between boss and player
            const centerX = this.boss ? this.boss.position.x : 38;
            const centerZ = 0;
            
            cube.position.x = centerX + Math.cos(cube.userData.angle) * cube.userData.radius;
            cube.position.z = centerZ + Math.sin(cube.userData.angle) * cube.userData.radius;
            cube.position.y = 8 + Math.sin(cube.userData.angle * 2) * 1;
            
            cube.rotation.x += 0.05;
            cube.rotation.y += 0.03;
        });
        
        requestAnimationFrame(() => this.animateEndingCubes());
    }
    
    // ANIMATION FUNCTIONS
    createDaggerAnimation() {
        // Create dagger projectile
        const daggerGeometry = new THREE.ConeGeometry(0.1, 1, 4);
        const daggerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xcccccc,
            emissive: 0x666666,
            emissiveIntensity: 0.2
        });
        const dagger = new THREE.Mesh(daggerGeometry, daggerMaterial);
        
        // Start at player position
        if (this.playerBattleForm) {
            dagger.position.copy(this.playerBattleForm.position);
        }
        dagger.rotation.x = Math.PI / 2; // Point forward
        
        this.scene.add(dagger);
        this.battleEffects.push({
            type: 'dagger',
            object: dagger,
            startTime: Date.now(),
            duration: 1000
        });
    }
    
    createHealAnimation() {
        // Create healing particles
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshLambertMaterial({
                color: 0x00ff00,
                emissive: 0x00aa00,
                emissiveIntensity: 0.6
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            if (this.playerBattleForm) {
                particle.position.copy(this.playerBattleForm.position);
                particle.position.x += (Math.random() - 0.5) * 2;
                particle.position.z += (Math.random() - 0.5) * 2;
            }
            
            this.scene.add(particle);
            this.battleEffects.push({
                type: 'heal',
                object: particle,
                startTime: Date.now(),
                duration: 2000,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    0.05,
                    (Math.random() - 0.5) * 0.02
                )
            });
        }
    }
    
    createSonicAnimation() {
        // Create expanding sonic wave spheres
        for (let i = 0; i < 4; i++) {
            const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 12);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.6,
                wireframe: true
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            if (this.playerBattleForm) {
                sphere.position.copy(this.playerBattleForm.position);
            }
            
            this.scene.add(sphere);
            this.battleEffects.push({
                type: 'sonic',
                object: sphere,
                startTime: Date.now() + i * 150,
                duration: 1200,
                initialScale: 0.1 + i * 0.05
            });
        }
        
        // Create additional energy particles
        for (let i = 0; i < 12; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff44ff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            if (this.playerBattleForm) {
                particle.position.copy(this.playerBattleForm.position);
                const angle = (i / 12) * Math.PI * 2;
                particle.position.x += Math.cos(angle) * 1;
                particle.position.z += Math.sin(angle) * 1;
            }
            
            this.scene.add(particle);
            this.battleEffects.push({
                type: 'sonicParticle',
                object: particle,
                startTime: Date.now(),
                duration: 1000,
                velocity: new THREE.Vector3(
                    Math.cos((i / 12) * Math.PI * 2) * 0.1,
                    (Math.random() - 0.5) * 0.05,
                    Math.sin((i / 12) * Math.PI * 2) * 0.1
                )
            });
        }
    }
    
    createLaserAnimation() {
        // Create laser beam
        const laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        
        if (this.boss && this.playerBattleForm) {
            laser.position.copy(this.boss.position);
            laser.lookAt(this.playerBattleForm.position);
            laser.rotateX(Math.PI / 2);
        }
        
        this.scene.add(laser);
        this.battleEffects.push({
            type: 'laser',
            object: laser,
            startTime: Date.now(),
            duration: 800
        });
    }
    
    createMissileAnimation() {
        // Create missile
        const missileGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
        const missileMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            emissive: 0xff4400,
            emissiveIntensity: 0.3
        });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);
        
        if (this.boss) {
            missile.position.copy(this.boss.position);
        }
        
        this.scene.add(missile);
        this.battleEffects.push({
            type: 'missile',
            object: missile,
            startTime: Date.now(),
            duration: 1200
        });
    }
    
    createBossHealAnimation() {
        // Create healing aura around boss
        for (let i = 0; i < 6; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const particleMaterial = new THREE.MeshLambertMaterial({
                color: 0x00ff88,
                emissive: 0x00aa44,
                emissiveIntensity: 0.5
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            if (this.boss) {
                particle.position.copy(this.boss.position);
                particle.position.x += (Math.random() - 0.5) * 3;
                particle.position.z += (Math.random() - 0.5) * 3;
            }
            
            this.scene.add(particle);
            this.battleEffects.push({
                type: 'bossHeal',
                object: particle,
                startTime: Date.now(),
                duration: 2500,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    0.03,
                    (Math.random() - 0.5) * 0.01
                )
            });
        }
    }
    
    updateBattleEffects(deltaTime) {
        const currentTime = Date.now();
        
        for (let i = this.battleEffects.length - 1; i >= 0; i--) {
            const effect = this.battleEffects[i];
            const elapsed = currentTime - effect.startTime;
            
            if (elapsed < 0) continue; // Effect hasn't started yet
            
            if (elapsed > effect.duration) {
                // Remove expired effect
                this.scene.remove(effect.object);
                this.battleEffects.splice(i, 1);
                continue;
            }
            
            // Update effect based on type
            switch (effect.type) {
                case 'dagger':
                    if (this.boss) {
                        const direction = new THREE.Vector3().subVectors(this.boss.position, effect.object.position).normalize();
                        effect.object.position.add(direction.multiplyScalar(0.3));
                    }
                    break;
                    
                case 'heal':
                case 'bossHeal':
                    effect.object.position.add(effect.velocity);
                    effect.object.material.opacity = 1 - (elapsed / effect.duration);
                    break;
                    
                case 'sonic':
                    const progress = elapsed / effect.duration;
                    const scale = effect.initialScale + progress * 8;
                    effect.object.scale.set(scale, scale, scale);
                    effect.object.material.opacity = 0.6 * (1 - progress);
                    effect.object.rotation.y += 0.1;
                    break;
                    
                case 'sonicParticle':
                    effect.object.position.add(effect.velocity);
                    const particleProgress = elapsed / effect.duration;
                    effect.object.material.opacity = 1 - particleProgress;
                    effect.object.scale.setScalar(1 + particleProgress * 2);
                    effect.object.rotation.x += 0.2;
                    effect.object.rotation.y += 0.15;
                    break;
                    
                case 'laser':
                    effect.object.material.emissiveIntensity = 0.8 * (1 - elapsed / effect.duration);
                    break;
                    
                case 'missile':
                    if (this.playerBattleForm) {
                        const direction = new THREE.Vector3().subVectors(this.playerBattleForm.position, effect.object.position).normalize();
                        effect.object.position.add(direction.multiplyScalar(0.2));
                        effect.object.rotation.y += 0.1;
                    }
                    break;
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showMessage("💔 Game Over!<br>Don't give up! Claire believes in you!<br>Stars collected: " + this.stars);
        
        // Hide boss fight UI
        document.getElementById('bossHealthBar').style.display = 'none';
        document.getElementById('playerHealthBar').style.display = 'none';
        document.getElementById('bossControls').style.display = 'none';
        
        // Hide mobile boss controls if on mobile
        if (this.isMobile) {
            document.getElementById('mobileBossControls').style.display = 'none';
        }
        
        // Restore original player if in battle form
        this.restorePlayerForm();
        
        // Clean up arena and teleport back
        this.cleanupArena();
        this.teleportBackToGame();
        
        console.log("💔 Game Over!");
    }
    
    restorePlayerForm() {
        if (this.originalPlayer && this.playerBattleForm) {
            this.originalPlayer.visible = true;
            this.originalPlayer.position.copy(this.playerBattleForm.position);
            this.originalPlayer.position.y -= 2; // Ground level
            this.scene.remove(this.playerBattleForm);
            this.playerBattleForm = null;
            this.player = this.originalPlayer;
            this.originalPlayer = null;
        }
        
        // Clean up battle effects
        this.battleEffects.forEach(effect => {
            this.scene.remove(effect.object);
        });
        this.battleEffects = [];
        
        // Clean up ending cubes
        this.endingCubes.forEach(cube => {
            this.scene.remove(cube);
        });
        this.endingCubes = [];
    }
    
    showMessage(text) {
        document.getElementById('messageText').innerHTML = text;
        document.getElementById('gameMessage').style.display = 'block';
    }
    
    updateUI() {
        document.getElementById('stars').textContent = `⭐ Stars: ${this.stars}`;
        document.getElementById('lives').textContent = `❤️ Lives: ${this.lives}`;
    }
    
    gameLoop() {
        const deltaTime = this.clock.getDelta();
        
        this.updatePlayer(deltaTime);
        this.updateTurtles(deltaTime);
        this.animateCollectibles(deltaTime);
        this.updatePowerUp(deltaTime);
        this.updateBoss(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
let game;

window.addEventListener('load', () => {
    game = new ClaireGame();
    window.game = game; // Make game globally accessible
    
    // Add debug function to window for console access
    window.debugBoss = () => {
        if (game) game.debugBossFight();
        else console.log('Game not initialized');
    };
});

// Restart function
function restartGame() {
    // Reset game state
    if (game) {
        // Clear the scene
        while(game.scene.children.length > 0) {
            game.scene.remove(game.scene.children[0]);
        }
    }
    
    // Hide message and boss fight UI
    document.getElementById('gameMessage').style.display = 'none';
    document.getElementById('bossHealthBar').style.display = 'none';
    document.getElementById('playerHealthBar').style.display = 'none';
    document.getElementById('bossControls').style.display = 'none';
    
    // Hide mobile boss controls
    document.getElementById('mobileBossControls').style.display = 'none';
    document.getElementById('flyControls').style.display = 'none';
    
    // Clean up any remaining battle effects
    if (game) {
        game.restorePlayerForm();
    }
    
    // Create new game
    game = new ClaireGame();
    window.game = game; // Make new game globally accessible
}

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.camera.aspect = window.innerWidth / window.innerHeight;
        game.camera.updateProjectionMatrix();
        game.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}); 