import { Upload, Brain, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload Video",
      subtitle: "5-10 min reflection",
      description: "Record directly or upload your daily reflection video securely.",
      bullets: ["Webcam or file upload", "Private & secure", "Instant processing"],
      color: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/20"
    },
    {
      icon: Brain,
      step: "02",
      title: "AI Analysis",
      subtitle: "Instant feedback",
      description: "Our AI analyzes your speech patterns, tone, and body language.",
      bullets: ["Voice analysis", "Posture detection", "Sentiment tracking"],
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20"
    },
    {
      icon: TrendingUp,
      step: "03",
      title: "Get Insights",
      subtitle: "Actionable goals",
      description: "Receive a personalized report with tips to improve your skills.",
      bullets: ["Confidence score", "Improvement tips", "Progress tracking"],
      color: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-500/20"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-blue-500">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to transform your communication skills with the power of AI.
            </p>
          </motion.div>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Animated Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 -z-10" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative group"
              >
                {/* Step Badge */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl ring-4 ring-background transition-transform duration-300 group-hover:scale-110",
                    "bg-gradient-to-br", step.color, step.shadow
                  )}>
                    {step.step}
                  </div>
                </div>

                {/* Card */}
                <div className="pt-10 h-full">
                  <div className={cn(
                    "h-full p-8 rounded-3xl bg-card border border-border/50 shadow-xl transition-all duration-300",
                    "hover:shadow-2xl hover:-translate-y-2 group-hover:border-brand-green/30"
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
                      step.color
                    )}>
                      <Icon className={cn("w-8 h-8", step.color.split(' ')[1].replace('to-', 'text-'))} />
                    </div>

                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                        {step.subtitle}
                      </p>
                      <p className="text-muted-foreground mb-6">
                        {step.description}
                      </p>

                      {/* Hover Details */}
                      <div className="pt-4 border-t border-border/50">
                        <ul className="space-y-2 text-left">
                          {step.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Sparkles className="w-3 h-3 text-brand-green" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Arrow */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-8 text-muted-foreground/30">
                    <ArrowRight className="w-8 h-8 rotate-90" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
