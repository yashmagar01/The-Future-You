import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, TrendingUp, Target, Sparkles, MessageSquare, Heart } from "lucide-react";
import Layout from "@/components/Layout";
// TODO: Add confetti celebration for gamification milestones
// import confetti from 'canvas-confetti';

const Home = () => {
  const features = [
    {
      icon: Video,
      title: "Daily Practice",
      description: "Record 5-10 minute self-reflections and build a consistent habit",
    },
    {
      icon: MessageSquare,
      title: "Speech Clarity",
      description: "Get feedback on pacing, volume, filler words, and articulation",
    },
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "Understand your tone and emotional presence in communication",
    },
    {
      icon: Target,
      title: "Personalized Goals",
      description: "Receive tailored tips and exercises to improve faster",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Visualize your improvement journey with detailed metrics",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Advanced analysis that learns and adapts to your growth",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-scale-in">
            <Sparkles className="h-4 w-4" />
            Your Personal Communication Coach
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-balance leading-tight">
            Build Confidence Through
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Daily Reflections
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Upload 5-10 min reflections daily and transform your communication skills with AI-powered video feedback.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button 
              size="lg" 
              className="text-lg h-14 px-8 shadow-medium hover-lift"
              asChild
            >
              <Link to="/record">
                <Video className="mr-2 h-5 w-5" />
                Start Recording
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg h-14 px-8 hover-lift"
              asChild
            >
              <Link to="/dashboard">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free to start • Desktop only
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Improve
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our AI analyzes multiple aspects of your communication to provide comprehensive, actionable feedback
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 hover-lift cursor-default"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto max-w-3xl text-center">
          <Card className="p-12 shadow-strong">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Communication?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of people building confidence through daily practice
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg h-14 px-8" asChild>
                <Link to="/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-lg h-14 px-8" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
