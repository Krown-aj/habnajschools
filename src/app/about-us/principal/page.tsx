"use client";

import React, { memo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaCog, FaTrophy, FaPhone, FaEnvelope, FaGraduationCap } from "react-icons/fa";
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
        if (!input && input !== "") return null;

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
            // cleanup
            return () => {
                URL.revokeObjectURL(url);
                setObjectUrl(null);
            };
        } else {
            setObjectUrl((prev) => {
                if (prev) {
                    try {
                        URL.revokeObjectURL(prev);
                    } catch (e) {
                        // ignore
                    }
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
            className={`object-cover ${className}`}
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
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meet the Principal of Habnaj International Schools</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Leadership focused on academic excellence, discipline and student development.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaGraduationCap />} title="Role" subtitle="Principal since 2018/2019">
                            {MANAGEMENT.principal.name} leads the school with a focus on academic standards and operational excellence.
                        </InfoCard>

                        <InfoCard icon={<FaCog />} title="Focus" subtitle="Academic excellence & discipline">
                            Ensuring teachers are supported and students learn in a safe, structured environment.
                        </InfoCard>

                        <InfoCard icon={<FaTrophy />} title="Achievements" subtitle="Improved outcomes & systems">
                            Strengthened curriculum delivery and student outcomes through targeted interventions and staff development.
                        </InfoCard>
                    </motion.div>

                    {/* Main content — biography, leadership philosophy, message */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">About the Principal</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.principal.name} has been serving as Principal of Habnaj International Schools since 2018/2019 till date. With broad experience in school management and
                                pedagogy, he champions student-centred learning, strong assessment practices and continuous teacher development. His leadership ensures
                                that the school maintains high standards across creche to senior secondary levels.
                            </p>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Leadership Philosophy</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.principal.name} advocates a balanced approach: rigorous academics complemented by character formation and extracurricular engagement. He
                                supports evidence-based teaching, inclusive policies and regular staff training to improve classroom outcomes.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Student-Centred Learning</h4>
                                    <p className="text-sm text-gray-600 mt-1">Differentiated instruction to meet varied learning needs.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Holistic Development</h4>
                                    <p className="text-sm text-gray-600 mt-1">Fostering academic, social and emotional growth.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            {/* Principal photo */}
                            <div className="w-full md:w-40 h-40 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <ImageWithFallback src={principalImg} alt={`Principal — ${MANAGEMENT.principal.name}`} className="w-full h-full" name={MANAGEMENT.principal.name} />
                            </div>

                            <div className="flex-1">
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
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Commitment to Excellence</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.principal.name} is committed to maintaining a safe, effective learning environment through robust policies, regular staff training and a
                                child-first approach to discipline and welfare.
                            </p>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our school?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> {CONTACT.phone}
                        </a>
                        <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 px-4 py-2 text-blue-500">
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
    <article className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                <span className="inline-flex items-center justify-center h-6 w-6">
                    {icon}
                </span>
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
