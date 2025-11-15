import Layout from "@/components/Layout";
import Hero from "@/components/home/Hero";
import VideoEmbed from "@/components/home/VideoEmbed";
import ProblemSolutionOutcome from "@/components/home/ProblemSolutionOutcome";
import HowItWorks from "@/components/home/HowItWorks";
import TechCards from "@/components/home/TechCards";
import FeatureGrid from "@/components/home/FeatureGrid";
import Roadmap from "@/components/home/Roadmap";
import TestimonialGrid from "@/components/home/TestimonialGrid";
import FooterCTA from "@/components/home/FooterCTA";
import Footer from "@/components/home/Footer";

const Home = () => {
  return (
    <Layout>
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. NotebookLM Video Block */}
      <VideoEmbed 
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="NotebookLM Overview - See How The Future You Works"
        caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
        poster="/assets/video-poster.svg"
      />

      {/* 3. Problem → Solution → Outcome */}
      <ProblemSolutionOutcome />

      {/* 4. How It Works (3-step flow) */}
      <HowItWorks />

      {/* 5. Tech & Implementation */}
      <TechCards />

      {/* 6. MVP Feature Grid */}
      <FeatureGrid />

      {/* 7. Roadmap / Next Steps */}
      <Roadmap />

      {/* 8. Testimonials / Social Proof */}
      <TestimonialGrid />

      {/* 9. Footer CTA */}
      <FooterCTA />

      {/* 10. Footer with Copyright & Links */}
      <Footer />
    </Layout>
  );
};

export default Home;
