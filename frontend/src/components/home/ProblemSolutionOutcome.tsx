import { AlertCircle, Lightbulb, TrendingUp, Check, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ProblemSolutionOutcome = () => {
  const sections = [
    {
      icon: AlertCircle,
      title: "The Problem",
      subtitle: "Why it's hard",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      blobColor: "bg-red-500",
      description: "Most people struggle with public speaking and self-presentation. Traditional coaching is expensive, and practicing alone provides no feedback.",
      points: [
        "Lack of confidence in communication",
        "No structured feedback mechanism",
        "Expensive coaching alternatives",
        "Hard to track improvement over time"
      ],
      checkIcon: X,
      badge: null
    },
    {
      icon: Lightbulb,
      title: "Our Solution",
      subtitle: "How we help",
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
      blobColor: "bg-brand-green",
      description: "An AI-powered platform that provides instant, detailed feedback on your video reflections. Practice daily in a judgment-free environment.",
      points: [
        "AI analysis of speech & body language",
        "Daily practice habit formation",
        "Instant, detailed feedback reports",
        "Affordable and accessible 24/7"
      ],
      checkIcon: Check,
      badge: { text: "Available Now", color: "bg-brand-green/20 text-brand-green border-brand-green/30", animate: "glow" }
    },
    {
      icon: TrendingUp,
      title: "The Outcome",
      subtitle: "What you get",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      blobColor: "bg-blue-500",
      description: "Build genuine confidence through consistent practice. Track measurable improvement and become the speaker you've always wanted to be.",
      points: [
        "Targeted confidence building",
        "Measurable progress tracking",
        "Improved professional opportunities",
        "Lifelong communication skills"
      ],
      checkIcon: ArrowRight,
      badge: { text: "Your Future", color: "bg-blue-500/20 text-blue-500 border-blue-500/30", animate: "pulse" }
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-green/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Why <span className="text-brand-green">The Future You?</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We're solving a real problem with cutting-edge AI technology, 
              making professional coaching accessible to everyone.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {sections.map((section, index) => {
            const Icon = section.icon;
            const CheckIcon = section.checkIcon;
            
            return (
              <motion.div 
                key={index}
                variants={cardVariants}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className={cn(
                  "h-full p-8 rounded-3xl",
                  "bg-card/50 backdrop-blur-sm",
                  "border border-border/50",
                  "shadow-xl hover:shadow-2xl hover:shadow-brand-green/5",
                  "transition-all duration-300",
                  "flex flex-col"
                )}>
                  {/* Gradient Blob */}
                  <div className={`absolute -right-20 -top-20 w-60 h-60 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${section.blobColor}`} />

                  {/* Icon Header */}
                  <div className={cn(
                    "inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-6",
                    section.bgColor,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <Icon className={`h-8 w-8 ${section.color}`} />
                  </div>

                  {/* Content */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider block ${section.color}`}>
                        {section.subtitle}
                      </span>
                      {section.badge && (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            boxShadow: section.badge.animate === "glow" 
                              ? ["0 0 0px rgba(0,0,0,0)", "0 0 10px rgba(34,197,94,0.3)", "0 0 0px rgba(0,0,0,0)"]
                              : "none"
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            repeatType: "reverse" 
                          }}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                            section.badge.color,
                            section.badge.animate === "pulse" && "animate-pulse"
                          )}
                        >
                          {section.badge.text}
                        </motion.span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                  </div>

                  {/* Points List */}
                  <ul className="space-y-4 mt-auto">
                    {section.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 group/item">
                        <div className={cn(
                          "mt-0.5 p-1 rounded-full flex-shrink-0 transition-colors",
                          section.bgColor,
                          "group-hover/item:bg-opacity-100"
                        )}>
                          <CheckIcon className={`w-3 h-3 ${section.color}`} />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolutionOutcome;
