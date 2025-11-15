import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TestimonialGrid = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      avatar: "/assets/avatars/avatar-1.jpg",
      initials: "SJ",
      rating: 5,
      quote: "This platform transformed my presentation skills. I went from dreading public speaking to confidently leading team meetings. The AI feedback is incredibly detailed!",
      highlight: "Transformed presentation skills"
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      avatar: "/assets/avatars/avatar-2.jpg",
      initials: "MC",
      rating: 5,
      quote: "As an introvert, practicing in a judgment-free environment was game-changing. I can now articulate my ideas clearly in meetings and code reviews.",
      highlight: "Judgment-free practice"
    },
    {
      name: "Emily Rodriguez",
      role: "Entrepreneur",
      avatar: "/assets/avatars/avatar-3.jpg",
      initials: "ER",
      rating: 5,
      quote: "Preparing for investor pitches became so much easier. The detailed analytics helped me identify and fix my filler words and pacing issues.",
      highlight: "Perfect for pitch prep"
    },
    {
      name: "David Park",
      role: "College Student",
      avatar: "/assets/avatars/avatar-4.jpg",
      initials: "DP",
      rating: 5,
      quote: "This is like having a personal speech coach available 24/7. My grades improved because I can now present with confidence in class.",
      highlight: "Improved class presentations"
    },
    {
      name: "Lisa Thompson",
      role: "HR Director",
      avatar: "/assets/avatars/avatar-5.jpg",
      initials: "LT",
      rating: 5,
      quote: "I use this before every important interview and performance review. Being able to review my body language and tone has been invaluable.",
      highlight: "Essential for interviews"
    },
    {
      name: "James Wilson",
      role: "Sales Executive",
      avatar: "/assets/avatars/avatar-6.jpg",
      initials: "JW",
      rating: 5,
      quote: "My close rate improved by 30% after just 2 months of daily practice. Understanding my communication patterns was a real eye-opener.",
      highlight: "30% better close rate"
    }
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-current" />
            Loved by Thousands
          </div>
          <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real stories from people who transformed their communication skills
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-6 hover-lift cursor-default border hover:border-border/80 transition-all"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Quote Icon */}
              <div className="flex items-start justify-between mb-4">
                <Quote className="h-8 w-8 text-brand-green/20 fill-current" />
                
                {/* Star Rating */}
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-warning fill-current" />
                  ))}
                </div>
              </div>

              {/* Quote Text */}
              <p className="text-foreground mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </p>

              {/* Highlight Badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium mb-4">
                {testimonial.highlight}
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-gradient-to-br from-brand-green to-accent text-white font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-brand-green mb-2">10k+</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-accent mb-2">50k+</p>
            <p className="text-sm text-muted-foreground">Reflections Recorded</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary mb-2">95%</p>
            <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-warning mb-2">4.9/5</p>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialGrid;
