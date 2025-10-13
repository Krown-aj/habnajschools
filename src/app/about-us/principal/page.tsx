"use client";

import React, { memo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaPhone, FaEnvelope, FaGraduationCap } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const ImageWithFallback: React.FC<{
    src?: string | null | { src?: string; url?: string } | File | Blob;
    alt?: string;
    className?: string;
    name?: string;
}> = ({ src, alt, className = "", name = "Profile" }) => {
    const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=512`;

    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [currentSrc, setCurrentSrc] = useState<string>(placeholder);
    const [erroredOnce, setErroredOnce] = useState(false);

    const resolveStringSrc = (input: any): string | null => {
        if (input === null || input === undefined) return null;
        if (typeof input === "string") {
            const t = input.trim();
            return t === "" ? null : t;
        }
        if (input instanceof File || input instanceof Blob) {
            return null;
        }
        if (typeof input === "object") {
            if (typeof input.src === "string" && input.src.trim() !== "") return input.src.trim();
            if (typeof input.url === "string" && input.url.trim() !== "") return input.url.trim();
        }
        return null;
    };

    useEffect(() => {
        if (src instanceof File || src instanceof Blob) {
            const url = URL.createObjectURL(src);
            setObjectUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setObjectUrl(null);
            };
        } else {
            setObjectUrl((prev) => {
                if (prev) {
                    try {
                        URL.revokeObjectURL(prev);
                    } catch { }
                }
                return null;
            });
        }
    }, [src]);

    useEffect(() => {
        const resolved = resolveStringSrc(src);
        if (resolved) {
            setCurrentSrc(resolved);
            setErroredOnce(false);
            return;
        }
        if (objectUrl) {
            setCurrentSrc(objectUrl);
            setErroredOnce(false);
            return;
        }
        setCurrentSrc(placeholder);
        setErroredOnce(false);
    }, [src, objectUrl, name, placeholder]);

    return (
        <img
            src={currentSrc}
            alt={alt || name}
            className={`object-cover w-full h-full ${className}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
                if (!erroredOnce) {
                    setCurrentSrc(placeholder);
                    setErroredOnce(true);
                } else {
                    const t = e.currentTarget as HTMLImageElement;
                    t.removeAttribute("src");
                }
            }}
        />
    );
};

const PrincipalAboutOptimized: React.FC = () => {
    const principalRaw = (images as any).principal;
    const principalImg =
        typeof principalRaw === "string" || principalRaw instanceof File || principalRaw instanceof Blob
            ? principalRaw
            : principalRaw?.src ?? "/assets/musa.jpg";

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner: gradient */}
            <header className="relative w-full h-[36vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meet the Principal of Habnaj International Schools</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Leadership focused on academic excellence, discipline and student development.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: image (moderate) then about below it — reduced width (lg:col-span-1) */}
                    <motion.div variants={fadeUp} className="lg:col-span-1 space-y-4">
                        {/* Image with constrained height */}
                        <article className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <div className="w-full bg-gray-100 h-56 sm:h-64 md:h-84 overflow-hidden">
                                <ImageWithFallback src={principalImg} alt={`Principal — ${MANAGEMENT.principal.name}`} className="" name={MANAGEMENT.principal.name} />
                            </div>
                        </article>

                        {/* About card below the image (compact) */}
                        <article className="bg-white rounded-2xl p-4 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">About the Principal</h2>
                            <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.principal.name} has been serving as Principal of Habnaj International Schools since 2018/2019. He champions student-centred learning, strong assessment practices and continuous teacher development.
                            </p>
                        </article>
                    </motion.div>

                    {/* Right column: Leadership Philosophy card with Role & Commitment displayed like the two feature boxes (occupies larger width) */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Leadership Philosophy</h2>
                            <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.principal.name} advocates a balanced approach: rigorous academics complemented by character formation and extracurricular engagement. He supports evidence-based teaching and inclusive policies.
                            </p>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Role</h4>
                                    <p className="text-sm text-gray-600 mt-1">Principal since 2018/2019 — leads the school with a focus on academic standards and operational excellence.</p>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Commitment</h4>
                                    <p className="text-sm text-gray-600 mt-1">Maintaining a safe, effective learning environment through policies, staff training and a child-first approach.</p>
                                </div>
                            </div>
                        </article>

                        {/* Message card */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Message from the Principal</h3>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                At Habnaj International Schools, our focus is to prepare learners for tomorrow’s challenges by combining strong academics with character education. We work closely with parents and staff to create a resilient and supportive environment for every child.
                            </p>

                            <div className="mt-4">
                                <div className="text-sm text-gray-600 font-medium">— {MANAGEMENT.principal.name}</div>
                                <div className="text-xs text-gray-400">Principal, Habnaj International Schools</div>
                            </div>

                            <div className="mt-5">
                                <Link href="/about-us/mission-vission" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                    <FaBook /> Our Mission & Vision
                                </Link>
                            </div>
                        </article>

                        {/* Compact commitment card already moved to leadership philosophy */}
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our school?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded">
                            <FaPhone /> {CONTACT.phone}
                        </a>
                        <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 px-3 py-2 text-blue-500">
                            <FaEnvelope /> {CONTACT.email}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default PrincipalAboutOptimized;

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = memo(({ icon, title, subtitle, children }) => (
    <article className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                <span className="inline-flex items-center justify-center h-5 w-5">{icon}</span>
            </div>

            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
                {children && <p className="mt-2 text-sm text-gray-600" style={{ textAlign: "justify" }}>{children}</p>}
            </div>
        </div>
    </article>
));
InfoCard.displayName = "InfoCard";
