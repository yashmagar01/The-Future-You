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
      <main role="main" aria-label="Homepage content">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. NotebookLM Video Block */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/30" aria-labelledby="video-section-heading">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6 sm:mb-8 px-2">
            <h2 id="video-section-heading" className="text-2xl sm:text-3xl font-bold mb-3">See How It Works</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Watch this quick overview powered by NotebookLM to understand our approach
            </p>
          </div>
          
          <VideoEmbed 
            src="https://www.youtube.com/watch?v=pVO6QOt-8QE"
            title="NotebookLM Overview - See How The Future You Works"
            caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
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
      </main>
    </Layout>
  );
};

export default Home;
