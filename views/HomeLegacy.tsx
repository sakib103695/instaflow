import Header from '../components/Header';
import Hero from '../components/Hero';
import VoiceDemo from '../components/VoiceDemo';
import Features from '../components/Features';
import Industries from '../components/Industries';
import Footer from '../components/Footer';

export default function HomeLegacy() {
  return (
    <div className="min-h-screen flex flex-col bg-grid bg-[#0a0312]">
      <Header />

      <main className="flex-grow pt-32">
        <section className="px-6 max-w-6xl mx-auto text-center">
          <Hero />
          <VoiceDemo />
        </section>

        <Features />
        <Industries />
      </main>

      <Footer />
    </div>
  );
}
