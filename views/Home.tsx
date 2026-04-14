import { Frame130 } from "@/components/home/Frame130";
import { Hero } from "@/components/home/Hero";
import { Security } from "@/components/home/Security";
import RevenueCalculator from "@/components/home/RevenueCalculator";
import Footer from "@/components/Footer";
import Header from "@/components/home/Header";
import FinalCTA from "@/components/home/FinalCTA";
import FAQ from "@/components/home/FAQ";
import type { AgentConfig } from "@/lib/clientTypes";
import type { VoiceOption } from "@/constants";

type HomeProps = {
  agentConfig: AgentConfig;
  availableVoices?: VoiceOption[];
};

export default function Home({ agentConfig, availableVoices }: HomeProps) {
  return (
    <div className="bg-black text-white">
      <Header />
      <Hero agentConfig={agentConfig} availableVoices={availableVoices} />
      <RevenueCalculator />
      <Security />
      <Frame130 />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
