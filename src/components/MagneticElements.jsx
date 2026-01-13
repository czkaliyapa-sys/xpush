// components/MagneticElements.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { GetStarted } from './index';
import Magnet from './Magnet';

const MagneticElements = () => {
  const [merged, setMerged] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.3, once: true });
  const controls = useAnimation();

  // Auto-merge when component comes into view
  useEffect(() => {
    if (isInView && !merged) {
      const timer = setTimeout(() => {
        setMerged(true);
        setShowLightning(true);
        // Hide lightning after animation
        setTimeout(() => setShowLightning(false), 2000);
      }, 3000); // Give 3 seconds to see the magnetic attraction
      
      return () => clearTimeout(timer);
    }
  }, [isInView, merged]);

  // Lightning SVG component
  const LightningBolt = ({ className }) => (
    <motion.svg
      className={className}
      width="200"
      height="300"
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: showLightning ? [0, 1, 1, 0] : 0,
        scale: showLightning ? [0, 1.2, 1, 0] : 0,
        rotate: showLightning ? [0, 5, -5, 0] : 0
      }}
      transition={{ 
        duration: 1.5, 
        times: [0, 0.2, 0.8, 1],
        ease: "easeInOut"
      }}
    >
      <defs>
        <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d="M100 10 L60 120 L90 120 L70 290 L140 160 L110 160 L100 10 Z"
        fill="url(#lightningGradient)"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: showLightning ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </motion.svg>
  );

  // Particle effect for energy
  const EnergyParticles = () => (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400 rounded-full"
          initial={{ 
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            opacity: 0
          }}
          animate={showLightning ? {
            x: [null, 0, Math.random() * 100 - 50],
            y: [null, 0, Math.random() * 100 - 50],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          } : {}}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <div ref={ref} className="relative flex justify-center items-center h-[500px] w-full overflow-visible py-12 px-8">
      {/* Energy Particles */}
      <EnergyParticles />
      
      {/* Lightning Effects */}
      {showLightning && (
        <>
          <LightningBolt className="absolute z-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12" />
          <LightningBolt className="absolute z-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 scale-75" />
        </>
      )}

      {!merged ? (
        <>
          {/* Left Element - "You and" */}
          <motion.div
            className="absolute"
            initial={{ x: -180, y: 0 }}
            animate={{
              x: merged ? -20 : -180,
              y: [0, -12, 0, -6, 0]
            }}
            transition={{
              x: { 
                type: "spring", 
                stiffness: merged ? 400 : 80, 
                damping: merged ? 25 : 30,
                duration: merged ? 1.5 : 2.0
              },
              y: { 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 2.5, 
                ease: "easeInOut" 
              }
            }}
            drag={!merged}
            dragConstraints={{ left: -300, right: -20, top: -120, bottom: 120 }}
            onDragEnd={() => !merged && setMerged(true)}
            whileDrag={{ scale: 1.05, rotate: 3 }}
          >
            <Magnet>
              <motion.div
                className="item"
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                animate={{ 
                  scale: merged ? 0 : 1.3, // Larger scale
                  opacity: merged ? 0 : 1,
                  filter: showLightning ? "brightness(1.5) saturate(1.5)" : "brightness(1)"
                }}
                transition={{ duration: merged ? 0.8 : 0.3 }}
              >
                <GetStarted texta={"You and"} />
              </motion.div>
            </Magnet>
          </motion.div>

          {/* Right Element - "Us" */}
          <motion.div
            className="absolute"
            initial={{ x: 180, y: 0 }}
            animate={{
              x: merged ? 20 : 180,
              y: [0, -12, 0, -6, 0]
            }}
            transition={{
              x: { 
                type: "spring", 
                stiffness: merged ? 400 : 80, 
                damping: merged ? 25 : 30,
                duration: merged ? 1.5 : 2.0
              },
              y: { 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 2.5, 
                ease: "easeInOut",
                delay: 0.8
              }
            }}
            drag={!merged}
            dragConstraints={{ left: 20, right: 300, top: -120, bottom: 120 }}
            onDragEnd={() => !merged && setMerged(true)}
            whileDrag={{ scale: 1.05, rotate: -3 }}
          >
            <Magnet>
              <motion.div
                className="item"
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                animate={{ 
                  scale: merged ? 0 : 1.3, // Larger scale
                  opacity: merged ? 0 : 1,
                  filter: showLightning ? "brightness(1.5) saturate(1.5)" : "brightness(1)"
                }}
                transition={{ duration: merged ? 0.8 : 0.3 }}
              >
                <GetStarted textb={"Us"} />
              </motion.div>
            </Magnet>
          </motion.div>
        </>
      ) : (
        /* Merged Component - "Winning Together" */
        <motion.div
          className="flex justify-center items-center relative z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: merged ? [0, 1.5, 1.3] : 0, // Larger final scale
            opacity: merged ? 1 : 0,
            y: [0, -12, 0, -6, 0],
            filter: showLightning ? "brightness(1.5) saturate(1.5) drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))" : "brightness(1)"
          }}
          transition={{ 
            scale: { duration: 1.2, times: [0, 0.7, 1], ease: "easeOut", delay: merged ? 0.5 : 0 },
            opacity: { duration: 0.8, delay: merged ? 0.5 : 0 },
            y: { 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 3, 
              ease: "easeInOut",
              delay: merged ? 2 : 0
            },
            filter: { duration: 0.5 }
          }}
        >
          {/* Power Ring Effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-30"
            animate={showLightning ? {
              scale: [1, 2.5, 1],
              opacity: [0.3, 0.8, 0.3]
            } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          <GetStarted texta={"Winning"} textb={"Together."} />
        </motion.div>
      )}
      
      {/* Magnetic Field Visualization */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={!merged ? {
          background: [
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 30%), radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 30%)",
            "radial-gradient(circle at 35% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 40%), radial-gradient(circle at 65% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 40%)",
            "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.5) 0%, transparent 50%)"
          ]
        } : merged ? {
          background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.6) 0%, transparent 60%)"
        } : {}}
        transition={{ duration: 4, repeat: merged ? 0 : Infinity, repeatType: "reverse" }}
      />
    </div>
  );
};

export default MagneticElements;
