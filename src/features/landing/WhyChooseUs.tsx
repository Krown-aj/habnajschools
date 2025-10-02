"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaUsers, FaLaptop, FaTrophy, FaHeart, /* FaGlobe */ } from 'react-icons/fa';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const features: Feature[] = [
    {
        icon: <FaGraduationCap className="text-4xl" />,
        title: "Excellence in Education",
        description: "Our curriculum is designed to meet international standards while maintaining local relevance, ensuring students receive world-class education.",
        color: "from-blue-500 to-blue-600"
    },
    {
        icon: <FaUsers className="text-4xl" />,
        title: "Experienced Teachers",
        description: "Our dedicated team of qualified teachers brings years of experience and passion for nurturing young minds to achieve their full potential.",
        color: "from-green-500 to-green-600"
    },
    {
        icon: <FaLaptop className="text-4xl" />,
        title: "Modern Technology",
        description: "State-of-the-art laboratories and computer rooms and digital learning tools prepare students for the technology-driven future while enhancing their learning experience.",
        color: "from-purple-500 to-purple-600"
    },
    {
        icon: <FaTrophy className="text-4xl" />,
        title: "Proven Results",
        description: "Our students consistently achieve outstanding results in national examinations and competitions, demonstrating our commitment to academic excellence.",
        color: "from-yellow-500 to-orange-500"
    },
    {
        icon: <FaHeart className="text-4xl" />,
        title: "Holistic Development",
        description: "We focus on developing not just academic skills but also character, leadership, and social responsibility in every student.",
        color: "from-pink-500 to-red-500"
    },
    /*  {
         icon: <FaGlobe className="text-4xl" />,
         title: "Global Perspective",
         description: "Our international partnerships and exchange programs provide students with global exposure and cultural understanding.",
         color: "from-cyan-500 to-teal-500"
     } */
];

const WhyChooseUs: React.FC = () => {
    return (
        <section className="w-full py-20 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-6xl font-bold text-gray-800 mb-4">
                        Why Choose <span className="text-blue-600">Habnaj International School?</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover what makes us the preferred choice for parents and students seeking
                        quality education and holistic development.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="group"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                        >
                            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100">
                                {/* Icon */}
                                <motion.div
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                                    whileHover={{ rotate: 5 }}
                                >
                                    {feature.icon}
                                </motion.div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-justify">
                                    {feature.description}
                                </p>

                                {/* Hover effect line */}
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mt-6 rounded-full"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
                                    viewport={{ once: true }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                {/* <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <div className="bg-gradient-to-r from-pink-600 to-red-400 rounded-2xl p-8 text-white">
                        <h3 className="text-3xl font-bold mb-4">Message from the Headmaster.</h3>
                        <p className="text-xl mb-6 opacity-90">
                            I am really pround to be the headmaster of Habnaj International Schools, where our structural atmosphere is very conducive for children's development. We assure you, our children will make a difference in the society. Habnaj International Schools can boast of well qualified and vibrant teachers who can inculcate in the lives of the children learning and morals. Remember, education is the bedrock of every society. Come and register your children!!!
                        </p>
                    </div>
                </motion.div> */}
            </div>
        </section>
    );
};

export default WhyChooseUs;