import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Circle, Square, Upload, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3">Record Your Reflection</h1>
          <p className="text-muted-foreground text-lg">
            Take 5-10 minutes to practice your communication skills
          </p>
        </div>

        <Alert className="mb-8 animate-slide-up">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tips:</strong> Find a quiet space, maintain good posture, look at the camera, 
            and speak clearly. Try to fill the full 5 minutes to get comprehensive feedback.
          </AlertDescription>
        </Alert>

        <Card className="p-8 mb-6 shadow-medium animate-scale-in">
          <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
            <Video className="h-16 w-16 text-muted-foreground" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-accent/5" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-5 w-5 fill-current" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Circle className="mr-2 h-5 w-5" />
                    Start Recording
                  </>
                )}
              </Button>
              
              <Button size="lg" variant="outline" className="px-8">
                <Upload className="mr-2 h-5 w-5" />
                Upload Video
              </Button>
            </div>

            {isRecording && (
              <div className="text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="font-medium">Recording in progress...</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Recording time: 0:00 / 10:00
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4">What to Talk About</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Practice an upcoming presentation or interview</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Reflect on your day and express your thoughts clearly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Explain a complex topic to build articulation skills</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Share a story or experience to work on engagement</span>
            </li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default Record;
