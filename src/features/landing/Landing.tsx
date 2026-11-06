"use client";

import React from "react";
import Hero from "./Hero";
import Features from "./Features";
import WhyChooseUs from "./WhyChooseUs";
import News from "./News";
import GetStarted from "./get-started";

const Landing: React.FC = () => {
    return (
        <article className="relative flex flex-col items-center justify-start w-full min-h-screen">
            <Hero />
            {/* <GetStarted /> */}
            <News />
            <Features />
            <WhyChooseUs />


        </article>
    );
};

export default Landing;
