import { motion } from "framer-motion";

const GlowPulse = ({ style }) => (
  <motion.div
    initial={{ opacity: 0.4, scale: 1 }}
    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
    style={{
      position: "absolute",
      borderRadius: "50%",
      width: "25px",
      height: "25px",
      backgroundColor: "rgba(0, 200, 255, 0.5)",
      boxShadow: "0 0 20px 10px rgba(0, 200, 255, 0.4)",
      pointerEvents: "none",
      ...style,
    }}
  />
);

export default GlowPulse;
