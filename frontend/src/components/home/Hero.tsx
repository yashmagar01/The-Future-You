import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, TrendingUp, Sparkles, ShieldCheck, Users } from "lucide-react";
import { motion, useScroll, useTransform, animate } from "framer-motion";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

// Stats Counter Component
const Counter = ({ from, to, suffix = "" }: { from: number; to: number; suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration: 2.5,
      onUpdate(value) {
        node.textContent = Math.floor(value).toLocaleString() + suffix;
      },
      ease: "easeOut"
    });

    return () => controls.stop();
  }, [from, to, suffix]);

  return <span ref={nodeRef} />;
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  const handlePrimaryClick = () => {
    logEvent(ANALYTICS_EVENTS.HERO_CTA_CLICK, { type: 'primary' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-green/5 via-background to-background">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-green/10 rounded-full blur-[120px] opacity-50"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] opacity-30"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="text-center lg:text-left"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green font-medium text-sm mb-6 border border-brand-green/20">
                <Sparkles className="w-4 h-4" />
                AI-Powered Communication Coach
              </span>
            </motion.div>

            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              Build Confidence <br className="hidden lg:block" />
              Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-teal-500 to-blue-600">Daily Reflections</span>
            </motion.h1>

            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Transform your speaking skills with instant AI feedback. 
              Practice in a private, judgment-free zone and track your growth over time.
            </motion.p>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Button 
                size="lg" 
                className="relative group bg-brand-green hover:bg-brand-green/90 text-white text-lg h-14 px-8 rounded-xl shadow-lg shadow-brand-green/25 hover:shadow-brand-green/40 transition-all duration-300 hover:-translate-y-1"
                asChild
                onClick={handlePrimaryClick}
              >
                <Link to="/record">
                  <Video className="mr-2 h-5 w-5" />
                  Start Recording — Free
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </Link>
              </Button>

              <Button 
                size="lg" 
                variant="outline"
                className="text-lg h-14 px-8 rounded-xl border-2 hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1"
                asChild
              >
                <Link to="/dashboard">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  View Dashboard
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>100% Private & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Join 50+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>No Credit Card Required</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visuals */}
          <div className="relative hidden lg:block h-[600px]">
            <motion.div style={{ y: y1 }} className="absolute right-0 top-10 z-10">
              <div className="bg-card/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20 w-72">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence Score</p>
                    <p className="text-2xl font-bold text-foreground">
                      <Counter from={0} to={95} suffix="%" />
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full bg-brand-green"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div style={{ y: y2 }} className="absolute left-10 bottom-20 z-20">
              <div className="bg-card/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20 w-64">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Video className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reflections</p>
                    <p className="text-2xl font-bold text-foreground">
                      <Counter from={0} to={100} suffix="+" />
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Visual Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="relative w-[400px] h-[500px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] shadow-2xl border-4 border-gray-800 overflow-hidden">
                  {/* Mock UI Interface */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-black/50 flex items-center justify-center gap-2">
                    <div className="w-16 h-4 bg-black rounded-full" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center animate-pulse">
                        <Video className="w-8 h-8 text-white" />
                     </div>
                  </div>
                  
                  {/* Floating badges inside phone */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-white/80">Recording... 04:20</span>
                    </div>
                    <div className="h-8 flex items-end gap-1">
                      {[40, 60, 30, 80, 50, 70, 40, 60].map((h, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: [h/2, h, h/2] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                          className="flex-1 bg-brand-green rounded-t-sm"
                        />
                      ))}
                    </div>
                  </motion.div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
