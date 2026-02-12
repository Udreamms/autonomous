'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Carousel } from './components/Carousel';

export default function SuiteDashboard() {
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-blue-500/30 select-none">
            {/* Pure Black Background */}
            <div className="absolute inset-0 bg-black" />

            {/* Main scrollable layout - Hidden scrollbars */}
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start pt-20 pb-10 overflow-y-auto overflow-x-hidden no-scrollbar">

                {/* 1. Greeting Section: Increased size for focus */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="mt-10 mb-0 text-center relative z-[2000] px-6"
                >
                    <span className="text-3xl md:text-5xl font-light text-white/50 tracking-tight block mb-4">Hi Udreamms</span>
                    <h2 className="text-3xl md:text-5xl font-extralight tracking-tighter text-white leading-tight">
                        Where should we start?
                    </h2>
                </motion.div>

                {/* 2. Carousel Area: Adjusted for larger central video */}
                <div className="relative w-full h-[950px] flex items-center justify-center">
                    <Carousel />
                </div>

                {/* 3. Title Section: Smaller and more subtle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center relative z-[2000] pointer-events-none mt-60 pb-10"
                >
                    <div className="h-[1px] w-12 bg-white/10 mx-auto mb-10" />
                    <h1 className="text-sm md:text-lg font-light tracking-[0.3em] mb-4 text-white/20 uppercase">
                        Autonomous Management System
                    </h1>
                    <p className="text-neutral-500 max-w-lg mx-auto leading-relaxed text-[10px] md:text-xs opacity-20 px-6">
                        Unified governance through decentralized protocols. Harmonizing operations, finance, and technology in a single autonomous flow.
                    </p>
                </motion.div>

            </div>
        </div>
    );
}
