import React from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            We'd love to hear from you. Here's how you can reach us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For general inquiries and support
              </p>
              <a href="mailto:support@thefutureyou.app" className="text-primary hover:underline font-medium">
                support@thefutureyou.app
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For privacy and data related questions
              </p>
              <a href="mailto:privacy@thefutureyou.app" className="text-primary hover:underline font-medium">
                privacy@thefutureyou.app
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Remote First<br />
                Global
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
