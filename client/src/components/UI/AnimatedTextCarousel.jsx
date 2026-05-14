import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedTextCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const words = ["🫐", "🥩", "🥦"];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 2000); // Change word every 2 seconds

        return () => clearInterval(interval);
    }, []);

    ////console.log("Current word:", words[currentIndex])

    // Define font styles for reuse
    const headingFont = { fontFamily: 'Montserrat, sans-serif' };
    const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' }; // Ensure quotes for multi-word font name


    return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            <h1
                className="text-3xl md:text-4xl font-bold text-center mb-2"
                style={{ ...headingFont }} // Use a heavier weight for main title
            >
                Transform Your Health, One Meal at a Time
            </h1>
            {/* <div className="text-8xl h-[48px] relative"> */}
            <div className="text-8xl sm:text-8xl h-[48px] relative w-full flex justify-center pt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute text-[#1976D2] drop-shadow-md"
                    >
                        {words[currentIndex]}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
