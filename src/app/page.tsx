"use client";

import Header from "@/components/ui/header/header";
import Footer from "@/components/ui/footer/footer";
import Landing from "@/features/landing/Landing";

const App = () => {
  return (
    <main className="w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 font-[family-name:var(--font-geist-sans)]">
      <Header />
      <Landing />
      <Footer />
    </main>
  )
}

export default App;