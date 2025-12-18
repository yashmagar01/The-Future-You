import { Video, TrendingUp, Rocket, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useSpring, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

const Hero = () => {
  const handlePrimaryCTAClick = () => {
    logEvent(ANALYTICS_EVENTS.HERO_CTA_CLICK, { type: 'primary', action: 'join_beta' });
  };

  const handleSecondaryCTAClick = () => {
    logEvent(ANALYTICS_EVENTS.HERO_CTA_CLICK, { type: 'secondary', action: 'how_it_works' });
    // Smooth scroll to HowItWorks section
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // State for animated counters
  const [displayReflections, setDisplayReflections] = useState(0);
  const [displayConfidence, setDisplayConfidence] = useState(0);

  // Animated counter for reflections (0 to 100)
  const reflectionCount = useSpring(0, { 
    duration: 2000,
    bounce: 0
  });

  // Animated percentage for confidence (0 to 95)
  const confidencePercent = useSpring(0, {
    duration: 2000,
    bounce: 0
  });

  // Subscribe to motion value changes
  useMotionValueEvent(reflectionCount, "change", (latest) => {
    setDisplayReflections(Math.floor(latest));
  });

  useMotionValueEvent(confidencePercent, "change", (latest) => {
    setDisplayConfidence(Math.floor(latest));
  });

  useEffect(() => {
    reflectionCount.set(100);
    confidencePercent.set(95);
  }, [reflectionCount, confidencePercent]);

  return (
    <header className="relative bg-gradient-to-b from-slate-50 to-white py-16 sm:py-20 lg:py-24 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge - Beta Launch */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/50 text-sm font-semibold mb-6"
            >
              <Rocket className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700">Beta Launch</span>
              <span className="text-slate-400">—</span>
              <span className="text-blue-600">Limited Spots</span>
            </motion.div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.15] text-slate-900">
              Build Confidence Through
            </h1>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transform your speaking skills with instant AI feedback. Practice in a private, judgment-free zone and track your growth over time.
            </p>
            
            {/* CTA Buttons - Beta Optimized */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button 
                size="lg" 
                className="bg-brand-green hover:bg-emerald-600 text-white text-base h-14 px-8 shadow-lg hover:shadow-xl transition-all font-semibold group"
                onClick={handlePrimaryCTAClick}
                asChild
              >
                <Link to="/waitlist">
                  <Rocket className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                  Join as Beta User
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-base h-14 px-8 border-slate-300 hover:bg-slate-100 hover:border-slate-400 font-medium"
                onClick={handleSecondaryCTAClick}
              >
                <Play className="mr-2 h-5 w-5" />
                How It Works
              </Button>
            </div>

            {/* Trust Badges - Beta Focused */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>100% Free During Beta</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">Join 50+ Beta Testers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">✨</span>
                <span>Shape the Product</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Mockup */}
          <div className="relative hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Main Dark Card */}
              <div className="relative bg-slate-900 rounded-3xl shadow-2xl aspect-[4/3] flex items-center justify-center border border-slate-800">
                {/* Recording Indicator (Pulsing Red Dot) */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      opacity: [1, 0.3, 1],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-3 h-3 rounded-full bg-red-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">Recording...</span>
                </div>

                {/* Video Icon */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center"
                >
                  <Video className="h-7 w-7 text-slate-400" />
                </motion.div>

                {/* Animated Bar Chart at Bottom */}
                <div className="absolute bottom-8 right-8 flex items-end gap-2 h-16">
                  {[40, 60, 80, 100].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ 
                        duration: 1,
                        delay: 0.6 + (index * 0.2),
                        ease: "easeOut"
                      }}
                      className={`w-8 rounded-t-md ${
                        index === 3 ? 'bg-brand-green' :
                        index === 2 ? 'bg-brand-green/70' :
                        index === 1 ? 'bg-brand-green/50' :
                        'bg-brand-green/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Card: Confidence Score */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-200 min-w-[180px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-brand-green" />
                  <span className="text-xs font-medium text-slate-600">Confidence Score</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {displayConfidence}%
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-green to-teal-400"
                  />
                </div>
              </motion.div>

              {/* Floating Card: Total Reflections */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-slate-200 min-w-[160px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-slate-600">Total Reflections</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {displayReflections}+
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
