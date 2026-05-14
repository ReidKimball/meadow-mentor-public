import { motion } from "framer-motion"

export const LoadingSpinner = () => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-32 h-32 border-8 border-blue-500 rounded-full border-t-transparent"
    />
  )
}
