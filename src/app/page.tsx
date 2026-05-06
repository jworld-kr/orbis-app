import SmoothScroll from "@/components/SmoothScroll";
import ScrollHUD from "@/components/ScrollHUD";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Problem from "@/components/sections/Problem";
import Coordinates from "@/components/sections/Coordinates";
import Pillars from "@/components/sections/Pillars";
import ChartForm from "@/components/sections/ChartForm";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";
import OrbitOrb from "@/components/account/OrbitOrb";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <ScrollHUD />
      <OrbitOrb />
      <main className="relative">
        <Hero />
        <About />
        <Problem />
        <Coordinates />
        <ChartForm />
        <Pillars />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
