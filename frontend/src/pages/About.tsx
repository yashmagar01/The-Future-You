import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { Video, Brain, Shield, Users } from "lucide-react";

export default function About() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">About The Future You</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to help everyone become a more confident and effective communicator through the power of AI-driven reflection.
          </p>
        </div>

        <div className="grid gap-12">
          <section className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">The Problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                Most people struggle with communication skills but lack a safe, private space to practice. 
                Traditional coaching is expensive, and practicing in front of a mirror doesn't provide 
                objective feedback. We wanted to bridge that gap.
              </p>
            </div>
            <div className="flex-1 bg-muted/50 rounded-xl p-8 h-64 flex items-center justify-center">
              <span className="text-muted-foreground italic">Illustration Placeholder</span>
            </div>
          </section>

          <section className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="flex-1">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Future You uses advanced local AI models to analyze your speech clarity, tone, 
                and body language. We provide instant, private feedback that helps you identify 
                areas for improvement without judgment.
              </p>
            </div>
            <div className="flex-1 bg-muted/50 rounded-xl p-8 h-64 flex items-center justify-center">
              <span className="text-muted-foreground italic">Illustration Placeholder</span>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-card border rounded-xl p-6">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                We believe your practice sessions are personal. That's why we prioritize local processing 
                and strict data retention policies. Your data is yours.
              </p>
            </div>
            <div className="bg-card border rounded-xl p-6">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community Driven</h3>
              <p className="text-muted-foreground">
                We're building this with our users. Our roadmap is shaped by the feedback and needs 
                of our community of early adopters.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
