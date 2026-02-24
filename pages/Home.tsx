import { Frame130 } from "@/components/home/Frame130";
import EffortlessGrowth from "@/components/home/EffortlessGrowth";
import { Hero } from "@/components/home/Hero";
import { Security } from "@/components/home/Security";
import { SmartGrowth } from "@/components/home/SmartGrowth";
import { WorkflowHeading } from "@/components/home/WorkflowHeading";
const WORKFLOW_SVG_SRC = "/assets/images/workflow.svg";
import Footer from "@/components/Footer";
import Header from "@/components/home/Header";
import { Testimonial } from "@/components/home/Testimonial";

export default function Home() {
  return (
    <div className="bg-black text-white">
      <Header />
      <Hero />
      <EffortlessGrowth />
      <Security />
      <SmartGrowth />
      <Frame130 />
      <WorkflowHeading />
      <div className="relative pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <img
          src={WORKFLOW_SVG_SRC}
          alt=""
          className="mx-auto w-full max-w-full sm:max-w-[571.714px]"
        />
        {/* Glow Background */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-[#8C21FF]/20 blur-[80px] sm:blur-[100px]" />
      </div>
      <Testimonial/>
      <Footer />
    </div>
  );
}
