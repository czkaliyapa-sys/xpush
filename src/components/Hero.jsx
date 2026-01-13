// components/Hero.jsx
import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';

import { motion, useAnimation } from 'framer-motion';
import { xpusers } from '../assets';
import styles from '../style';
import GlowPulse from '../external_components/GlowPulse';
import MagneticElements from './MagneticElements'; // ✅ import the new component

const Hero = () => {
  const constraintsRef = useRef(null);
    const borderControls = useAnimation();
    const [displayedText, setDisplayedText] = useState('');
    const fullText = 'A little push to get you there';

  // Ensure borders start hidden before first paint to avoid flash on reload
  useLayoutEffect(() => {
    borderControls.set("hidden");
  }, [borderControls]);

  // Typing animation
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Delay the start of border animation until after text slides in
  useEffect(() => {
    const timeout = setTimeout(() => {
      borderControls.start("visible");
    }, 2800); // adjusted for typing duration
    return () => clearTimeout(timeout);
  }, [borderControls]);

  return (
    <section
      id="home"
      style={{ marginTop: '-10%' }}
      className={`flex md:flex-row flex-col items-center ${styles.paddingY}`}
    >
      {/* Left Section - Animated Text */}
      <div className="flex-1 flex flex-col justify-start xl:px-0 sm:px-16 px-6">
        <motion.h1
          className="flex-1 font-poppins font-semibold text-[32px] sm:text-[44px] md:text-[60px] lg:text-[72px] xl:text-[80px] leading-[44px] sm:leading-[54px] md:leading-[72px] xl:leading-[80px] text-white"
        >
          {displayedText.length <= 'A little push '.length ? (
            <span className="text-white">{displayedText}</span>
          ) : (
            <>
              <span className="text-white">A little push </span>
              <span className="text-gradient">{displayedText.slice('A little push '.length)}</span>
            </>
          )}
        </motion.h1>
      </div>

      {/* Right Section - Image + Border Animation */}
      <div className="flex-1 flex justify-center items-center mt-6 sm:mt-10 md:mt-20 lg:mt-32 px-6 sm:px-10">
        <div className="relative w-[90%]">

          {/* Top Border */}
          <motion.div
            variants={{
              hidden: { scaleX: 0, opacity: 1 },
              visible: { scaleX: 1, opacity: 0 }
            }}
            initial="hidden"
            animate={borderControls}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0 }}
            className="absolute top-0 left-0 w-full h-[6px] bg-blue-500 origin-left"
          />

          {/* Right Border */}
          <motion.div
            variants={{
              hidden: { scaleY: 0, opacity: 1 },
              visible: { scaleY: 1, opacity: 0 }
            }}
            initial="hidden"
            animate={borderControls}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
            className="absolute top-0 right-0 h-full w-[6px] bg-blue-500 origin-top"
          />

          {/* Bottom Border */}
          <motion.div
            variants={{
              hidden: { scaleX: 0, opacity: 1 },
              visible: { scaleX: 1, opacity: 0 }
            }}
            initial="hidden"
            animate={borderControls}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
            className="absolute bottom-0 left-0 w-full h-[6px] bg-blue-500 origin-right"
          />

          {/* Left Border */}
          <motion.div
            variants={{
              hidden: { scaleY: 0, opacity: 1 },
              visible: { scaleY: 1, opacity: 0 }
            }}
            initial="hidden"
            animate={borderControls}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.6 }}
            className="absolute top-0 left-0 h-full w-[6px] bg-blue-500 origin-bottom"
          />

          {/* Image */}
          <motion.div
            className="item relative"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <img src={xpusers} alt="billing" className="w-full" />
          </motion.div>

        </div>
      </div>



    </section>
  );
};

export default Hero;
