// Secure Admin System for Claire's Adventure
class AdminSystem {
    constructor() {
        this.adminToken = null;
        this.secretKey = 'claire_adventure_secret_2024';
        this.sessionStart = Date.now();
        this.gameInstance = null;
        this.adminSettings = this.loadAdminSettings();
        
        // Initialize admin status check (always valid for embedded version)
        this.adminToken = this.createAdminToken(); // Auto-authenticate for embedded version
        this.startAnalyticsUpdater();
    }

    // Secure hash function
    generateHash(data, timestamp) {
        const combined = data + this.secretKey + timestamp;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Create secure admin token
    createAdminToken() {
        const timestamp = Date.now();
        const hash = this.generateHash('admin_authenticated', timestamp);
        return {
            hash: hash,
            timestamp: timestamp,
            expires: timestamp + (24 * 60 * 60 * 1000) // 24 hours
        };
    }

    // Validate admin token
    validateAdminToken(token) {
        if (!token || !token.hash || !token.timestamp || !token.expires) {
            return false;
        }

        // Check if token expired
        if (Date.now() > token.expires) {
            return false;
        }

        // Validate hash
        const expectedHash = this.generateHash('admin_authenticated', token.timestamp);
        return token.hash === expectedHash;
    }

    // Save admin status securely
    saveAdminStatus() {
        const token = this.createAdminToken();
        localStorage.setItem('claire_admin_token', JSON.stringify(token));
        localStorage.setItem('claire_admin_settings', JSON.stringify(this.adminSettings));
        this.adminToken = token;
    }

    // Load and validate admin status
    validateAdminStatus() {
        try {
            const tokenData = localStorage.getItem('claire_admin_token');
            if (!tokenData) {
                this.redirectToLogin();
                return false;
            }

            const token = JSON.parse(tokenData);
            if (!this.validateAdminToken(token)) {
                this.clearAdminStatus();
                this.redirectToLogin();
                return false;
            }

            this.adminToken = token;
            return true;
        } catch (error) {
            this.clearAdminStatus();
            this.redirectToLogin();
            return false;
        }
    }

    // Clear admin status
    clearAdminStatus() {
        localStorage.removeItem('claire_admin_token');
        localStorage.removeItem('claire_admin_settings');
        this.adminToken = null;
    }

    // Redirect to login if not authenticated
    redirectToLogin() {
        if (window.location.pathname !== '/game.html') {
            alert('Admin authentication required!');
            window.location.href = 'game.html';
        }
    }

    // Load admin settings
    loadAdminSettings() {
        try {
            const settings = localStorage.getItem('claire_admin_settings');
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            return this.getDefaultSettings();
        }
    }

    // Default admin settings
    getDefaultSettings() {
        return {
            godMode: false,
            infiniteLives: false,
            speedMultiplier: 1.0,
            jumpHeight: 1.0,
            physicsEnabled: true,
            gamePaused: false,
            wireframeMode: false,
            particlesEnabled: true,
            gridEnabled: false,
            giantMode: false,
            tinyMode: false,
            rainbowTrail: false,
            discoLights: false,
            superSpeed: false,
            pathTracking: false,
            lightingBrightness: 1.0
        };
    }

    // Save admin settings
    saveAdminSettings() {
        localStorage.setItem('claire_admin_settings', JSON.stringify(this.adminSettings));
    }

    // Update status indicator
    updateStatusIndicator(elementId, isOn) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = isOn ? 'ON' : 'OFF';
            element.className = isOn ? 'status-indicator status-on' : 'status-indicator status-off';
        }
    }

    // Update range value display
    updateRangeDisplay(elementId, value, suffix = 'x') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = parseFloat(value).toFixed(1) + suffix;
        }
    }

    // Start analytics updater
    startAnalyticsUpdater() {
        setInterval(() => {
            this.updateAnalytics();
        }, 1000);
    }

    // Update analytics display
    updateAnalytics() {
        const timeElapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        
        document.getElementById('timePlayed').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update other analytics if game instance exists
        if (this.gameInstance) {
            try {
                document.getElementById('deathCount').textContent = this.gameInstance.deathCount || 0;
                document.getElementById('starsCollected').textContent = this.gameInstance.stars || 0;
                document.getElementById('fpsCounter').textContent = Math.round(1000 / 16.67); // Approximate
                
                if (this.gameInstance.player) {
                    const pos = this.gameInstance.player.position;
                    const vel = this.gameInstance.playerVelocity || { x: 0, y: 0, z: 0 };
                    document.getElementById('playerPosition').textContent = 
                        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
                    document.getElementById('playerVelocity').textContent = 
                        `${vel.x.toFixed(1)}, ${vel.y.toFixed(1)}, ${vel.z.toFixed(1)}`;
                }
            } catch (error) {
                // Game instance not available yet
                console.log('Game analytics not ready yet');
            }
        } else {
            // Try to get embedded game instance
            try {
                if (window.embeddedGame) {
                    this.gameInstance = window.embeddedGame;
                }
            } catch (error) {
                // Not ready yet
            }
        }
    }
}

// Initialize admin system
const adminSystem = new AdminSystem();

// Player Controls
function toggleGodMode() {
    adminSystem.adminSettings.godMode = !adminSystem.adminSettings.godMode;
    adminSystem.updateStatusIndicator('godModeStatus', adminSystem.adminSettings.godMode);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setGodMode) {
        adminSystem.gameInstance.setGodMode(adminSystem.adminSettings.godMode);
    }
    console.log('👑 Admin: God Mode', adminSystem.adminSettings.godMode ? 'ON' : 'OFF');
}

function toggleInfiniteLives() {
    adminSystem.adminSettings.infiniteLives = !adminSystem.adminSettings.infiniteLives;
    adminSystem.updateStatusIndicator('infiniteLivesStatus', adminSystem.adminSettings.infiniteLives);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setInfiniteLives) {
        adminSystem.gameInstance.setInfiniteLives(adminSystem.adminSettings.infiniteLives);
    }
    console.log('👑 Admin: Infinite Lives', adminSystem.adminSettings.infiniteLives ? 'ON' : 'OFF');
}

function updateSpeedMultiplier(value) {
    adminSystem.adminSettings.speedMultiplier = parseFloat(value);
    adminSystem.updateRangeDisplay('speedValue', value);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setSpeedMultiplier) {
        adminSystem.gameInstance.setSpeedMultiplier(adminSystem.adminSettings.speedMultiplier);
    }
    console.log('👑 Admin: Speed Multiplier set to', value);
}

function updateJumpHeight(value) {
    adminSystem.adminSettings.jumpHeight = parseFloat(value);
    adminSystem.updateRangeDisplay('jumpValue', value);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setJumpHeight) {
        adminSystem.gameInstance.setJumpHeight(adminSystem.adminSettings.jumpHeight);
    }
    console.log('👑 Admin: Jump Height set to', value);
}

function setStarCount() {
    const count = parseInt(document.getElementById('starCount').value) || 0;
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setStarCount) {
        adminSystem.gameInstance.setStarCount(count);
    }
    console.log('👑 Admin: Star count set to', count);
}

// Game State Management
function resetLevel() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.resetLevel) {
        adminSystem.gameInstance.resetLevel();
    }
    console.log('👑 Admin: Level reset');
}

function skipToVictory() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.victory) {
        adminSystem.gameInstance.victory();
    }
    console.log('👑 Admin: Skipped to victory');
}

function togglePhysics() {
    adminSystem.adminSettings.physicsEnabled = !adminSystem.adminSettings.physicsEnabled;
    adminSystem.updateStatusIndicator('physicsStatus', adminSystem.adminSettings.physicsEnabled);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPhysicsEnabled) {
        adminSystem.gameInstance.setPhysicsEnabled(adminSystem.adminSettings.physicsEnabled);
    }
    console.log('👑 Admin: Physics', adminSystem.adminSettings.physicsEnabled ? 'ON' : 'OFF');
}

function pauseGame() {
    adminSystem.adminSettings.gamePaused = !adminSystem.adminSettings.gamePaused;
    const status = adminSystem.adminSettings.gamePaused ? 'PAUSED' : 'RUNNING';
    document.getElementById('pauseStatus').textContent = status;
    document.getElementById('pauseStatus').className = adminSystem.adminSettings.gamePaused ? 
        'status-indicator status-off' : 'status-indicator status-on';
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPaused) {
        adminSystem.gameInstance.setPaused(adminSystem.adminSettings.gamePaused);
    }
    console.log('👑 Admin: Game', status);
}

function unlockAllAreas() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.unlockAllAreas) {
        adminSystem.gameInstance.unlockAllAreas();
    }
    console.log('👑 Admin: All areas unlocked');
}

// Teleport Controls
function teleportToSpawn() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.teleportPlayer) {
        adminSystem.gameInstance.teleportPlayer(0, 3, 0);
    }
    console.log('👑 Admin: Teleported to spawn');
}

function teleportToBoss() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.teleportPlayer) {
        adminSystem.gameInstance.teleportPlayer(50, 15, 0);
    }
    console.log('👑 Admin: Teleported to boss arena');
}

function teleportToPowerUp() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.teleportPlayer) {
        adminSystem.gameInstance.teleportPlayer(25, 8, 0);
    }
    console.log('👑 Admin: Teleported to power-up');
}

function teleportToEnd() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.teleportPlayer) {
        adminSystem.gameInstance.teleportPlayer(35, 10, 0);
    }
    console.log('👑 Admin: Teleported to end');
}

function teleportToCoordinates() {
    const x = parseFloat(document.getElementById('teleportX').value) || 0;
    const y = parseFloat(document.getElementById('teleportY').value) || 0;
    const z = parseFloat(document.getElementById('teleportZ').value) || 0;
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.teleportPlayer) {
        adminSystem.gameInstance.teleportPlayer(x, y, z);
    }
    console.log(`👑 Admin: Teleported to (${x}, ${y}, ${z})`);
}

// Boss Fight Controls
function updateBossHealth(value) {
    adminSystem.updateRangeDisplay('bossHealthValue', value, '%');
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setBossHealth) {
        adminSystem.gameInstance.setBossHealth(parseInt(value));
    }
    console.log('👑 Admin: Boss health set to', value + '%');
}

function updatePlayerHealth(value) {
    adminSystem.updateRangeDisplay('playerHealthValue', value, '%');
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPlayerHealth) {
        adminSystem.gameInstance.setPlayerHealth(parseInt(value));
    }
    console.log('👑 Admin: Player health set to', value + '%');
}

function skipBossPrep() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.skipBossPrep) {
        adminSystem.gameInstance.skipBossPrep();
    }
    console.log('👑 Admin: Boss prep skipped');
}

function resetBossFight() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.resetBossFight) {
        adminSystem.gameInstance.resetBossFight();
    }
    console.log('👑 Admin: Boss fight reset');
}

function triggerBossLaser() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.triggerBossAbility) {
        adminSystem.gameInstance.triggerBossAbility('laser');
    }
    console.log('👑 Admin: Boss laser triggered');
}

function triggerBossMissile() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.triggerBossAbility) {
        adminSystem.gameInstance.triggerBossAbility('missile');
    }
    console.log('👑 Admin: Boss missile triggered');
}

function triggerBossHeal() {
    if (adminSystem.gameInstance && adminSystem.gameInstance.triggerBossAbility) {
        adminSystem.gameInstance.triggerBossAbility('heal');
    }
    console.log('👑 Admin: Boss heal triggered');
}

// Visual Controls
function toggleWireframe() {
    adminSystem.adminSettings.wireframeMode = !adminSystem.adminSettings.wireframeMode;
    adminSystem.updateStatusIndicator('wireframeStatus', adminSystem.adminSettings.wireframeMode);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setWireframeMode) {
        adminSystem.gameInstance.setWireframeMode(adminSystem.adminSettings.wireframeMode);
    }
    console.log('👑 Admin: Wireframe Mode', adminSystem.adminSettings.wireframeMode ? 'ON' : 'OFF');
}

function updateLighting(value) {
    adminSystem.adminSettings.lightingBrightness = parseFloat(value);
    adminSystem.updateRangeDisplay('lightingValue', value);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setLightingBrightness) {
        adminSystem.gameInstance.setLightingBrightness(adminSystem.adminSettings.lightingBrightness);
    }
    console.log('👑 Admin: Lighting brightness set to', value);
}

function toggleParticles() {
    adminSystem.adminSettings.particlesEnabled = !adminSystem.adminSettings.particlesEnabled;
    adminSystem.updateStatusIndicator('particlesStatus', adminSystem.adminSettings.particlesEnabled);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setParticlesEnabled) {
        adminSystem.gameInstance.setParticlesEnabled(adminSystem.adminSettings.particlesEnabled);
    }
    console.log('👑 Admin: Particles', adminSystem.adminSettings.particlesEnabled ? 'ON' : 'OFF');
}

function toggleGrid() {
    adminSystem.adminSettings.gridEnabled = !adminSystem.adminSettings.gridEnabled;
    adminSystem.updateStatusIndicator('gridStatus', adminSystem.adminSettings.gridEnabled);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setGridEnabled) {
        adminSystem.gameInstance.setGridEnabled(adminSystem.adminSettings.gridEnabled);
    }
    console.log('👑 Admin: Grid', adminSystem.adminSettings.gridEnabled ? 'ON' : 'OFF');
}

// Experimental Controls
function toggleGiantMode() {
    adminSystem.adminSettings.giantMode = !adminSystem.adminSettings.giantMode;
    if (adminSystem.adminSettings.giantMode) {
        adminSystem.adminSettings.tinyMode = false;
    }
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPlayerScale) {
        const scale = adminSystem.adminSettings.giantMode ? 3.0 : 
                     adminSystem.adminSettings.tinyMode ? 0.3 : 1.0;
        adminSystem.gameInstance.setPlayerScale(scale);
    }
    console.log('👑 Admin: Giant Mode', adminSystem.adminSettings.giantMode ? 'ON' : 'OFF');
}

function toggleTinyMode() {
    adminSystem.adminSettings.tinyMode = !adminSystem.adminSettings.tinyMode;
    if (adminSystem.adminSettings.tinyMode) {
        adminSystem.adminSettings.giantMode = false;
    }
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPlayerScale) {
        const scale = adminSystem.adminSettings.giantMode ? 3.0 : 
                     adminSystem.adminSettings.tinyMode ? 0.3 : 1.0;
        adminSystem.gameInstance.setPlayerScale(scale);
    }
    console.log('👑 Admin: Tiny Mode', adminSystem.adminSettings.tinyMode ? 'ON' : 'OFF');
}

function toggleRainbowTrail() {
    adminSystem.adminSettings.rainbowTrail = !adminSystem.adminSettings.rainbowTrail;
    adminSystem.updateStatusIndicator('rainbowStatus', adminSystem.adminSettings.rainbowTrail);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setRainbowTrail) {
        adminSystem.gameInstance.setRainbowTrail(adminSystem.adminSettings.rainbowTrail);
    }
    console.log('👑 Admin: Rainbow Trail', adminSystem.adminSettings.rainbowTrail ? 'ON' : 'OFF');
}

function toggleDiscoLights() {
    adminSystem.adminSettings.discoLights = !adminSystem.adminSettings.discoLights;
    adminSystem.updateStatusIndicator('discoStatus', adminSystem.adminSettings.discoLights);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setDiscoLights) {
        adminSystem.gameInstance.setDiscoLights(adminSystem.adminSettings.discoLights);
    }
    console.log('👑 Admin: Disco Lights', adminSystem.adminSettings.discoLights ? 'ON' : 'OFF');
}

function toggleSuperSpeed() {
    adminSystem.adminSettings.superSpeed = !adminSystem.adminSettings.superSpeed;
    adminSystem.updateStatusIndicator('superSpeedStatus', adminSystem.adminSettings.superSpeed);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setSuperSpeed) {
        adminSystem.gameInstance.setSuperSpeed(adminSystem.adminSettings.superSpeed);
    }
    console.log('👑 Admin: Super Speed', adminSystem.adminSettings.superSpeed ? 'ON' : 'OFF');
}

// Analytics Controls
function togglePathTracking() {
    adminSystem.adminSettings.pathTracking = !adminSystem.adminSettings.pathTracking;
    adminSystem.updateStatusIndicator('pathTrackingStatus', adminSystem.adminSettings.pathTracking);
    adminSystem.saveAdminSettings();
    
    if (adminSystem.gameInstance && adminSystem.gameInstance.setPathTracking) {
        adminSystem.gameInstance.setPathTracking(adminSystem.adminSettings.pathTracking);
    }
    console.log('👑 Admin: Path Tracking', adminSystem.adminSettings.pathTracking ? 'ON' : 'OFF');
}

function clearAnalytics() {
    adminSystem.sessionStart = Date.now();
    if (adminSystem.gameInstance && adminSystem.gameInstance.clearAnalytics) {
        adminSystem.gameInstance.clearAnalytics();
    }
    console.log('👑 Admin: Analytics cleared');
}

function exportData() {
    const data = {
        settings: adminSystem.adminSettings,
        sessionTime: Date.now() - adminSystem.sessionStart,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claire-admin-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('👑 Admin: Data exported');
}

// Navigation Functions (deprecated - game is now embedded)
function startGameAsAdmin() {
    console.log("Game is embedded below - no need to navigate!");
}

function startGameNormal() {
    console.log("Game is embedded below - no need to navigate!");
}

function goBack() {
    // Go back to main page
    window.location.href = '../index.html';
}

// Sync admin settings with game when available
function syncWithGame() {
    if (adminSystem.gameInstance) {
        const game = adminSystem.gameInstance;
        const settings = adminSystem.adminSettings;
        
        // Apply all current settings to the game
        if (game.setGodMode) game.setGodMode(settings.godMode);
        if (game.setInfiniteLives) game.setInfiniteLives(settings.infiniteLives);
        if (game.setSpeedMultiplier) game.setSpeedMultiplier(settings.speedMultiplier);
        if (game.setJumpHeight) game.setJumpHeight(settings.jumpHeight);
        if (game.setPhysicsEnabled) game.setPhysicsEnabled(settings.physicsEnabled);
        if (game.setPaused) game.setPaused(settings.gamePaused);
        if (game.setWireframeMode) game.setWireframeMode(settings.wireframeMode);
        if (game.setParticlesEnabled) game.setParticlesEnabled(settings.particlesEnabled);
        if (game.setGridEnabled) game.setGridEnabled(settings.gridEnabled);
        if (game.setLightingBrightness) game.setLightingBrightness(settings.lightingBrightness);
        if (game.setRainbowTrail) game.setRainbowTrail(settings.rainbowTrail);
        if (game.setDiscoLights) game.setDiscoLights(settings.discoLights);
        if (game.setSuperSpeed) game.setSuperSpeed(settings.superSpeed);
        if (game.setPathTracking) game.setPathTracking(settings.pathTracking);
        
        console.log('👑 Admin settings synced with game');
    }
}

// Initialize UI with saved settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update all UI elements with saved settings
    const settings = adminSystem.adminSettings;
    
    adminSystem.updateStatusIndicator('godModeStatus', settings.godMode);
    adminSystem.updateStatusIndicator('infiniteLivesStatus', settings.infiniteLives);
    adminSystem.updateStatusIndicator('physicsStatus', settings.physicsEnabled);
    adminSystem.updateStatusIndicator('wireframeStatus', settings.wireframeMode);
    adminSystem.updateStatusIndicator('particlesStatus', settings.particlesEnabled);
    adminSystem.updateStatusIndicator('gridStatus', settings.gridEnabled);
    adminSystem.updateStatusIndicator('rainbowStatus', settings.rainbowTrail);
    adminSystem.updateStatusIndicator('discoStatus', settings.discoLights);
    adminSystem.updateStatusIndicator('superSpeedStatus', settings.superSpeed);
    adminSystem.updateStatusIndicator('pathTrackingStatus', settings.pathTracking);
    
    // Update range inputs
    document.getElementById('speedMultiplier').value = settings.speedMultiplier;
    document.getElementById('jumpHeight').value = settings.jumpHeight;
    document.getElementById('lightingBrightness').value = settings.lightingBrightness;
    
    // Update range displays
    adminSystem.updateRangeDisplay('speedValue', settings.speedMultiplier);
    adminSystem.updateRangeDisplay('jumpValue', settings.jumpHeight);
    adminSystem.updateRangeDisplay('lightingValue', settings.lightingBrightness);
    
    console.log('👑 Admin Panel initialized with saved settings');
    
    // Try to connect to embedded game instance periodically
    const connectInterval = setInterval(() => {
        if (window.embeddedGame && !adminSystem.gameInstance) {
            adminSystem.gameInstance = window.embeddedGame;
            syncWithGame();
            console.log("🔗 Connected to embedded game instance");
            clearInterval(connectInterval);
        }
    }, 500);
    
    // Also try immediate sync if game instance is available
    setTimeout(() => {
        if (window.embeddedGame) {
            adminSystem.gameInstance = window.embeddedGame;
            syncWithGame();
        }
    }, 1000);
});

// Export admin system for game integration
window.adminSystem = adminSystem; 