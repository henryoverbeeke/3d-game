import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, Users, Target, Heart, Gift, Gamepad2 } from 'lucide-react'
import './App.css'

function App() {
  // Fun game messages
  const motivationalMessages = [
    "Adventure awaits! 🗡️",
    "You're a gaming legend! 🌟",
    "Claire needs your help! 💕",
    "Epic quests ahead! ✨",
    "You're the hero! 🦸‍♀️"
  ]

  const [currentMessage, setCurrentMessage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])





  return (
    <div className="app">
      <div className="background-animation">
        <div className="floating-hearts">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-heart"
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeInOut"
              }}
            >
              <Heart fill="rgba(255, 182, 193, 0.6)" color="rgba(255, 182, 193, 0.8)" size={20} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container">
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="header"
        >
                    <div className="logo">
            <Gamepad2 color="#ff69b4" size={32} />
            <h1>Claire's Adventure</h1>
          </div>
          
          <motion.div
            key={currentMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="motivational-message"
          >
            {motivationalMessages[currentMessage]}
          </motion.div>
          
          <motion.button
            className="game-button main-play-button"
            onClick={() => window.open('/game.html', '_blank')}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Gamepad2 size={24} />
            START ADVENTURE!
            <span className="game-button-subtitle">🎮 Epic 3D Platformer Game! 🌟</span>
          </motion.button>
        </motion.header>

                          <motion.div
           className="game-info-section"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.6, delay: 0.2 }}
         >
           <h2>🎮 Game Features</h2>
           <div className="game-features">
             <div className="feature">
               <Sparkles color="#ffd700" size={24} />
               <div>
                 <div className="feature-title">Epic Adventure</div>
                 <div className="feature-desc">Navigate floating platforms</div>
               </div>
             </div>
             <div className="feature">
               <Target color="#ff69b4" size={24} />
               <div>
                 <div className="feature-title">Collect Stars</div>
                 <div className="feature-desc">8 golden stars to find</div>
               </div>
             </div>
             <div className="feature">
               <Heart color="#e74c3c" size={24} />
               <div>
                 <div className="feature-title">Avoid Dangers</div>
                 <div className="feature-desc">Spikes & turtle enemies</div>
               </div>
             </div>
             <div className="feature">
               <CheckCircle color="#2ecc71" size={24} />
               <div>
                 <div className="feature-title">Power-ups</div>
                 <div className="feature-desc">"Claire is Awesome" mode</div>
               </div>
             </div>
             <div className="feature">
               <Users color="#9b59b6" size={24} />
               <div>
                 <div className="feature-title">Boss Fight</div>
                 <div className="feature-desc">Epic final battle</div>
               </div>
             </div>
             <div className="feature">
               <Gift color="#f39c12" size={24} />
               <div>
                 <div className="feature-title">3D Graphics</div>
                 <div className="feature-desc">Beautiful Three.js engine</div>
               </div>
             </div>
           </div>
           
           <div className="game-controls">
             <h3>🎯 How to Play</h3>
             <div className="controls-grid">
               <div className="control">
                 <strong>WASD</strong> - Move around
               </div>
               <div className="control">
                 <strong>SPACE</strong> - Jump (or fly!)
               </div>
               <div className="control">
                 <strong>MOUSE</strong> - Look around
               </div>
               <div className="control">
                 <strong>GOAL</strong> - Collect stars & beat boss!
               </div>
             </div>
           </div>
         </motion.div>

         {/* Game Gallery */}
         <motion.div
           className="game-gallery"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.4 }}
         >
           <h2>🎨 Game Screenshots</h2>
           <div className="screenshot-grid">
             <motion.div
               className="screenshot-placeholder"
               whileHover={{ scale: 1.05 }}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
             >
               <Gamepad2 size={48} color="#ff69b4" />
               <p>3D Platformer Action!</p>
             </motion.div>
             <motion.div
               className="screenshot-placeholder"
               whileHover={{ scale: 1.05 }}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.7 }}
             >
               <Target size={48} color="#ffd700" />
               <p>Collect Golden Stars!</p>
             </motion.div>
             <motion.div
               className="screenshot-placeholder"
               whileHover={{ scale: 1.05 }}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.9 }}
             >
               <CheckCircle size={48} color="#2ecc71" />
               <p>Epic Boss Battles!</p>
             </motion.div>
           </div>
         </motion.div>

         <motion.div
           className="game-story"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.6 }}
         >
           <h2>📖 Claire's Story</h2>
           <div className="story-content">
             <p>Join Claire on an epic 3D adventure through floating islands! Navigate treacherous platforms, avoid dangerous spikes and turtle enemies, and collect magical golden stars.</p>
             <p>Discover the legendary "Claire is Awesome" power-up that grants invincibility and the power of flight for 25 seconds!</p>
             <p>Face off against the evil boss cube in an ultimate showdown. Only with Claire's special powers can you defeat this menacing foe!</p>
           </div>
         </motion.div>

                  <motion.div
           className="cta-section"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.8 }}
         >
           <motion.button
             className="game-button mega-play-button"
             onClick={() => window.open('/game.html', '_blank')}
             whileHover={{ scale: 1.08, rotate: 1 }}
             whileTap={{ scale: 0.95 }}
           >
             <Gamepad2 size={32} />
             PLAY NOW!
             <span className="game-button-subtitle">🌟 The adventure begins here! 🌟</span>
           </motion.button>
         </motion.div>
       </div>
     </div>
   )
 }

export default App
