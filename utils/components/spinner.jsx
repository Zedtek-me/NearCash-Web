import React from "react";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";

const Spinner = ({ width = 100, height = 100, color = "text-black" }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white/70  flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 1.2,
        }}
      >
        <Loader
          className={`animate-spin ${color}`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default Spinner;
