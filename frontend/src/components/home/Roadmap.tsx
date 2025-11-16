import { useState } from "react";
import { CheckCircle2, Clock, Rocket, ChevronDown, Video, Users, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { logEvent, ANALYTICS_EVENTS } from "@/utils/analytics";

const Roadmap = () => {
  const milestones = [
    {
      id: "mvp",
      quarter: "Q2 2025",
      year: "2025",
      label: "MVP Launch",
      status: "upcoming",
      icon: Video,
      color: "bg-green-500",
      textColor: "text-green-600",
      eta: "19 April 2025",
      summary: "Core video analysis, scoring, posture detection, and dashboard",
      details: {
        description: "Complete MVP with core features for daily video reflection practice and AI-powered feedback.",
        features: [
          "Video recording & upload with webcam support",
          "Speech clarity scoring & analysis",
          "Emotional tone detection from voice & face",
          "Posture & gesture insights",
          "Progress dashboard with charts & metrics",
          "User authentication & private storage",
          "Personalized improvement tips"
        ]
      }
    },
    {
      id: "nvp",
      quarter: "Q3 2025",
      year: "2025",
      label: "NVP Release",
      status: "upcoming",
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      eta: "20 July 2025",
      summary: "Live roleplay sessions, gamification, enhanced emotional intelligence",
      details: {
        description: "Next Version Product introducing live practice sessions, gamification systems, and enhanced emotional intelligence tracking.",
        features: [
          "Live roleplay sessions with AI mentors",
          "Gamification with badges & achievements",
          "Enhanced emotional intelligence tracking",
          "Weekly challenges & progress milestones",
          "Community feedback & peer learning"
        ]
      }
    },
    {
      id: "dream",
      quarter: "Q4 2026",
      year: "2026",
      label: "Dream Project",
      status: "upcoming",
      icon: Sparkles,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      eta: "End of 2026",
      summary: "AI avatar mentor, long-term emotional intelligence tracking, and VR practice environments",
      details: {
        description: "Revolutionary features including personalized AI avatar mentors and immersive VR practice scenarios.",
        features: [
          "Custom AI avatar mentor",
          "Long-term emotional intelligence tracking",
          "VR practice hall environments",
          "Advanced pose analysis with full body tracking",
          "Industry-specific scenario libraries"
        ]
      }
    },
    {
      id: "enterprise",
      quarter: "Q1 2030",
      year: "2030",
      label: "Enterprise Version",
      status: "upcoming",
      icon: Rocket,
      color: "bg-orange-500",
      textColor: "text-orange-500",
      eta: "2030",
      summary: "Team analytics, organization-level insights, and enterprise coaching suite",
      details: {
        description: "Enterprise-grade features for teams, organizations, and training programs.",
        features: [
          "Team analytics dashboard",
          "Organization-level insights",
          "Enterprise coaching suite",
          "Custom branding & white-label options",
          "SSO & advanced security",
          "Admin controls & user management",
          "API access & integrations"
        ]
      }
    }
  ];

  const handleMilestoneOpen = (milestone: typeof milestones[0]) => {
    logEvent(ANALYTICS_EVENTS.ROADMAP_MILESTONE_OPEN, {
      milestone_id: milestone.id,
      milestone_label: milestone.label,
      milestone_quarter: milestone.quarter,
      milestone_status: milestone.status,
      milestone_eta: milestone.eta,
      location: 'homepage'
    });
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Clock className="h-4 w-4" />
            Product Roadmap
          </div>
          <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From MVP to dream features — here's what we're building
          </p>
        </div>

        {/* Timeline Progress Indicator */}
        <div className="mb-12">
          <div className="relative">
            {/* Background Line - Desktop Horizontal */}
            <div className="hidden md:block absolute top-6 left-0 w-full h-1 bg-border rounded-full" />
            
            {/* Progress Line - Desktop Horizontal */}
            <div 
              className="hidden md:block absolute top-6 left-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: '0%' }} // No milestones completed yet - all coming soon
            />

            {/* Mobile Vertical Timeline */}
            <div className="md:hidden absolute left-6 top-0 bottom-0 w-1 bg-border rounded-full" />
            <div 
              className="md:hidden absolute left-6 top-0 w-1 bg-gradient-to-b from-green-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ height: '0%' }}
            />

            {/* Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                const isCompleted = false; // No milestones completed yet
                const isCurrent = false; // All are upcoming
                
                return (
                  <div key={index} className="relative md:text-center">
                    {/* Mobile: Side layout, Desktop: Top layout */}
                    <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                      {/* Icon */}
                      <div className={`relative z-10 flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center mb-0 md:mb-3 ${milestone.color} ${
                        isCompleted ? 'text-white shadow-lg' : isCurrent ? 'text-white shadow-lg animate-pulse' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                        ) : isCurrent ? (
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        ) : (
                          <Clock className="h-6 w-6" aria-hidden="true" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 md:flex-none text-left md:text-center">
                        <p className={`font-semibold text-sm mb-1 ${milestone.textColor}`}>
                          {milestone.quarter} {milestone.year}
                        </p>
                        <p className="text-xs font-medium text-foreground mb-1">
                          {milestone.label}
                        </p>
                        <p className="text-xs text-muted-foreground hidden md:block">
                          {milestone.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestone Details Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isCompleted = false; // No milestones completed yet
            const isCurrent = false; // All are upcoming/planned

            return (
              <AccordionItem 
                key={milestone.id} 
                value={milestone.id}
                className="border-2 rounded-lg overflow-hidden hover:border-border/80 transition-all"
              >
                <AccordionTrigger 
                  className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/50"
                  aria-label={`${milestone.label} milestone details`}
                  onClick={() => handleMilestoneOpen(milestone)}
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-xl ${milestone.color} flex items-center justify-center shadow-lg flex-shrink-0 ${
                      isCurrent ? 'animate-pulse' : ''
                    }`}>
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="text-xl font-bold">{milestone.label}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          milestone.id === 'mvp' ? 'bg-green-500/10 text-green-600' :
                          milestone.id === 'enterprise' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-blue-500/10 text-blue-600'
                        }`}>
                          {milestone.id === 'mvp' ? 'Coming Soon' : milestone.id === 'enterprise' ? 'Future Plan' : 'Planned'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {milestone.summary}
                      </p>
                      <p className={`text-xs font-medium ${milestone.textColor}`}>
                        {milestone.eta}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6 pt-2">
                  <div className="pl-16 space-y-4">
                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">
                      {milestone.details.description}
                    </p>

                    {/* Features List */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {milestone.details.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className={`h-4 w-4 ${milestone.textColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Want to influence our roadmap? Join our community and share your feedback!
          </p>
          <button className="text-brand-green hover:text-brand-green/80 font-semibold text-sm transition-colors">
            Join the Conversation →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
