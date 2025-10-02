"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaPhone,
    FaEnvelope,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";
import { images, CONTACT } from "@/constants";

type ImageItem = {
    id: number;
    src: any; // StaticImageData | string
    alt: string;
    title: string;
    description: string;
    category: string;
};

const CONTACT_PHONE = CONTACT.phone;
const CONTACT_EMAIL = CONTACT.email;

const GALLERY_IMAGES: ImageItem[] = [
    { id: 1, src: (images as any).jss, alt: "Students in Classroom", title: "Engaging Classroom Learning", description: "Students actively participating in a mathematics lesson at Habnaj International Schools.", category: "Classroom" },
    { id: 2, src: (images as any).basketball, alt: "Playground Fun", title: "Playground Activities", description: "Children enjoying playtime on our safe and spacious playground.", category: "Facilities" },
    { id: 3, src: (images as any).jss2, alt: "Science Day Exhibition", title: "Science Day 2024", description: "Students showcasing innovative experiments during the annual Science Day.", category: "Events" },
    { id: 4, src: (images as any).computerroom2, alt: "Computer Room", title: "ICT Learning Hub", description: "Students developing digital skills in our modern computer room.", category: "Facilities" },
    { id: 5, src: (images as any).basketball, alt: "Basketball Court", title: "Basketball Tournament", description: "Students competing in an exciting basketball match on our court.", category: "Sports" },
    { id: 6, src: (images as any).basketball, alt: "Football Pitch", title: "Football Match", description: "A lively football match fostering teamwork and sportsmanship.", category: "Sports" },
    { id: 7, src: (images as any).student8, alt: "Mathematics Day", title: "Annual Mathematics Day", description: "Students celebrating mathematical achievements with quizzes and awards.", category: "Events" },
    { id: 8, src: (images as any).jss, alt: "Debating Club", title: "Debating Club Event", description: "Members of the Debating Club sharpening their public speaking skills.", category: "Clubs" },
];

/* ----------------------
   Motion
   ---------------------- */
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.36 } } };

/* ----------------------
   Gallery Card
   ---------------------- */
const GalleryCard: React.FC<{ image: ImageItem; onOpen: (id: number) => void }> = ({ image, onOpen }) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="relative group bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer"
            onClick={() => onOpen(image.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(image.id);
                }
            }}
            whileHover={{ scale: 1.02 }}
        >
            <div className="relative w-full h-68">
                <Image src={image.src} alt={image.alt} fill className="object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                        {image.title}
                    </p>
                </div>
            </div>

            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{image.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{image.description}</p>
                <div className="mt-3 text-xs text-gray-400">{image.category}</div>
            </div>
        </motion.div>
    );
};

/* ----------------------
   Main component
   ---------------------- */
const PhotoGallery: React.FC = () => {
    // single image navigation state
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const imagesList = GALLERY_IMAGES;
    const totalItems = imagesList.length;

    const currentImage = imagesList[currentIndex];

    const openLightbox = (id: number) => {
        setSelectedId(id);
        setCurrentIndex(imagesList.findIndex((i) => i.id === id));
        document.body.style.overflow = "hidden";
    };
    const closeLightbox = () => {
        setSelectedId(null);
        document.body.style.overflow = "";
    };

    // navigation for lightbox
    const showPrev = () => {
        const prev = (currentIndex - 1 + totalItems) % totalItems;
        setCurrentIndex(prev);
        setSelectedId(imagesList[prev].id);
    };
    const showNext = () => {
        const next = (currentIndex + 1) % totalItems;
        setCurrentIndex(next);
        setSelectedId(imagesList[next].id);
    };

    // close if selected id removed
    useEffect(() => {
        if (selectedId == null) return;
        if (!imagesList.some((i) => i.id === selectedId)) {
            setSelectedId(null);
            document.body.style.overflow = "";
        }
    }, [imagesList, selectedId]);

    // keyboard + focus trap for lightbox
    const modalRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (selectedId == null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            else if (e.key === "ArrowLeft") showPrev();
            else if (e.key === "ArrowRight") showNext();
            else if (e.key === "Tab") {
                const container = modalRef.current;
                if (!container) return;
                const focusables = Array.from(container.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(Boolean);
                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement as HTMLElement | null;
                if (!e.shiftKey && active === last) {
                    e.preventDefault();
                    first.focus();
                } else if (e.shiftKey && active === first) {
                    e.preventDefault();
                    last.focus();
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedId]);

    // touch swipe for lightbox
    const touchStartRef = useRef<number | null>(null);
    const touchDeltaRef = useRef(0);
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
        touchDeltaRef.current = 0;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current == null) return;
        touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
    };
    const onTouchEnd = () => {
        const dx = touchDeltaRef.current;
        const threshold = 50;
        if (dx > threshold) showPrev();
        else if (dx < -threshold) showNext();
        touchStartRef.current = null;
        touchDeltaRef.current = 0;
    };

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* HERO */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Photo Gallery — Capturing Moments at Habnaj</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Explore the vibrant life at Habnaj International Schools through our photo gallery.</p>
                    </motion.div>
                </div>
            </header>

            {/* Single Image Display */}
            <section className="container mx-auto px-6 sm:px-8 py-6">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-6">
                    <div className="flex justify-center">
                        <div className="w-full max-w-md sm:max-w-2xl">
                            <AnimatePresence initial={false}>
                                {currentImage && (
                                    <GalleryCard
                                        key={currentImage.id}
                                        image={currentImage}
                                        onOpen={openLightbox}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedId != null && (() => {
                    const selected = imagesList.find((i) => i.id === selectedId);
                    if (!selected) return null;

                    return (
                        <motion.div
                            key="lightbox"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                            onClick={closeLightbox}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`${selected.title} preview`}
                        >
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.96, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto outline-none"
                                onClick={(e) => e.stopPropagation()}
                                ref={modalRef}
                            >
                                <button
                                    aria-label="Close preview"
                                    className="absolute top-4 right-4 z-20 inline-flex items-center justify-center p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow"
                                    onClick={closeLightbox}
                                >
                                    <FaTimes />
                                </button>

                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                                    <button
                                        onClick={showPrev}
                                        aria-label="Previous image"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/90 hover:bg-white text-gray-800 shadow text-sm"
                                    >
                                        <FaChevronLeft /> Previous
                                    </button>
                                </div>

                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                                    <button
                                        onClick={showNext}
                                        aria-label="Next image"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/90 hover:bg-white text-gray-800 shadow text-sm"
                                    >
                                        Next <FaChevronRight />
                                    </button>
                                </div>

                                <div className="w-full h-[55vh] sm:h-[70vh] bg-gray-100 relative flex items-center justify-center" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                                    <Image src={selected.src} alt={selected.alt} fill className="object-contain" loading="lazy" />
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900">{selected.title}</h3>
                                    <p className="text-sm text-gray-700 mt-2">{selected.description}</p>
                                    <div className="mt-4 flex items-center justify-between gap-4">
                                        <div className="text-xs text-gray-500">{selected.category}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="container mx-auto px-6 sm:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Want to learn more about our school?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> {CONTACT_PHONE}
                        </a>
                        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 px-4 py-2 text-blue-500">
                            <FaEnvelope /> {CONTACT_EMAIL}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default PhotoGallery;