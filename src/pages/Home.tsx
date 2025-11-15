import Layout from "@/components/Layout";
import Hero from "@/components/home/Hero";
import VideoEmbed from "@/components/VideoEmbed";
import ProblemSolutionOutcome from "@/components/home/ProblemSolutionOutcome";
import HowItWorks from "@/components/home/HowItWorks";
import TechCards from "@/components/home/TechCards";
import TechStackSummary from "@/components/TechStackSummary";
import MVPFeatureGrid from "@/components/MVPFeatureGrid";
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
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">See How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Watch this quick overview powered by NotebookLM to understand our approach
            </p>
          </div>
          
          <VideoEmbed 
            src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            title="NotebookLM Overview - See How The Future You Works"
            caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
            poster="/assets/video-poster.svg"
          />
        </div>
      </section>

      {/* 3. Problem → Solution → Outcome */}
      <ProblemSolutionOutcome />

      {/* 4. How It Works (3-step flow) */}
      <HowItWorks />

      {/* 5. Tech & Implementation */}
      <TechCards />

      {/* 5b. Tech Stack Deep Dive */}
      <TechStackSummary />

      {/* 6. MVP Feature Grid */}
      <MVPFeatureGrid />

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
