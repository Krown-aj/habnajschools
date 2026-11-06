"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { FaGraduationCap, FaUsers, FaTrophy, FaBook } from "react-icons/fa";
import { images } from "@/constants";

interface StatItem {
    icon: React.ElementType;
    value: string;
    label: string;
    color: string;
}

const container = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const stats: StatItem[] = [
    { icon: FaGraduationCap, value: "500+", label: "Students", color: "text-yellow-300" },
    { icon: FaUsers, value: "25+", label: "Teachers", color: "text-cyan-300" },
    { icon: FaTrophy, value: "30+", label: "Awards", color: "text-orange-300" },
];

const Hero: React.FC = () => {
    return (
        <header className="relative w-full h-[80vh] sm:h-[100vh] overflow-hidden">
            {/* Background image + overlay */}
            <Image src={images.computerroom} alt="Habnaj International Schools campus" fill className="object-cover object-center" priority />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/40 to-cyan-600/25" />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="max-w-3xl w-full">
                    <motion.h1
                        variants={fadeUp}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-20 text-white font-extrabold leading-tight text-center sm:text-left"
                    >
                        Welcome to Habnaj International Schools
                    </motion.h1>
                    <motion.p
                        variants={fadeUp}
                        className="bg-black/10 backdrop-blur-2xl border-white p-4 sm:p-5 my-6 sm:my-8 text-white/90 text-base sm:text-lg md:text-xl text-justify max-w-2xl mx-auto sm:mx-0 rounded-lg"
                    >
                        Habnaj International Schools offers quality education to prepare your children for future success through academic excellence, self-discipline, communication skills, and a love for learning, from creche to senior secondary.
                    </motion.p>
                    {/* <motion.div
                        variants={fadeUp}
                        className="my-6 sm:my-8 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start"
                    >
                        <Link href="/auth/signin">
                            <Button
                                label="Get Started"
                                className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 border-none backdrop-blur-2xl text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                                aria-label="Get Started"
                            />
                        </Link>
                        <Link href="/admissions/how-to-apply">
                            <Button
                                label="How to Apply"
                                className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 border-none backdrop-blur-2xl text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                                aria-label="How to Apply"
                            />
                        </Link>
                    </motion.div> */}
                    {/* Stats */}
                    <motion.div
                        variants={fadeUp}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 my-12"
                    >
                        {stats.map((s, idx) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4"
                                >
                                    <div className="flex items-center justify-center">
                                        <Icon className={`text-3xl sm:text-4xl ${s.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
                                        <div className="text-xs sm:text-sm text-white/80 font-bold">{s.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
            >
                <div className="w-5 sm:w-6 h-8 sm:h-10 border-2 border-white rounded-full flex justify-center">
                    <div className="w-1 h-2 sm:h-3 bg-white rounded-full mt-2" />
                </div>
            </motion.div>
        </header>
    );
};

export default Hero;