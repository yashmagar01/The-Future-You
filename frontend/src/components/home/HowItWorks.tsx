import { Upload, Brain, TrendingUp, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Upload Video",
      subtitle: "5-10 min reflection",
      description: "Record directly or upload your daily reflection video securely. We support all major formats.",
      bullets: ["Webcam or file upload", "Private & secure", "Instant processing"],
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
      borderColor: "border-brand-green/20",
      gradient: "from-brand-green to-emerald-600",
      shadow: "shadow-brand-green/10"
    },
    {
      icon: Brain,
      step: "02",
      title: "AI Analysis",
      subtitle: "Instant feedback",
      description: "Our AI analyzes your speech patterns, tone, and body language to identify key areas for growth.",
      bullets: ["Voice analysis", "Posture detection", "Sentiment tracking"],
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/10"
    },
    {
      icon: TrendingUp,
      step: "03",
      title: "Get Insights",
      subtitle: "Actionable goals",
      description: "Receive a personalized report with specific tips and exercises to improve your communication skills.",
      bullets: ["Confidence score", "Improvement tips", "Progress tracking"],
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      gradient: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-500/10"
    }
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-white/50">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
              How It <span className="text-brand-green">Works</span>
            </h2>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Three simple steps to transform your communication skills with the power of AI.
            </p>
          </motion.div>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Animated Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-green/20 via-blue-500/20 to-purple-500/20 -z-10" />
          
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
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl ring-4 ring-white transition-transform duration-300 group-hover:scale-110",
                    "bg-gradient-to-br", step.gradient, step.shadow
                  )}>
                    {step.step}
                  </div>
                </div>

                {/* Card */}
                <div className="pt-10 h-full">
                  <div className={cn(
                    "h-full p-8 rounded-3xl bg-white border shadow-xl transition-all duration-300",
                    "hover:shadow-2xl hover:-translate-y-2",
                    step.borderColor,
                    step.shadow
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-colors duration-300",
                      step.bgColor
                    )}>
                      <Icon className={cn("w-8 h-8", step.color)} />
                    </div>

                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2 text-slate-900">{step.title}</h3>
                      <div className={cn("inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4", step.bgColor, step.color)}>
                        {step.subtitle}
                      </div>
                      <p className="text-slate-600 mb-8 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Hover Details */}
                      <div className="pt-6 border-t border-slate-100">
                        <ul className="space-y-3 text-left">
                          {step.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0", step.color)} />
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
                  <div className="md:hidden flex justify-center my-8 text-slate-200">
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
