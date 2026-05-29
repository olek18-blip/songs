import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Check, Download, Clock } from "lucide-react";
import { Link } from "wouter";

export default function OrderSuccess() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      
      <Card className="relative z-10 max-w-md w-full p-8 bg-card/80 backdrop-blur-sm border-border/50 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Payment Successful!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Your personalized song is being created by our AI. You'll receive an email with your download link shortly.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-left">
            <Music className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">AI Composition</p>
              <p className="text-xs text-muted-foreground">Our AI is writing unique lyrics and composing your song</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-left">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Generation in Progress</p>
              <p className="text-xs text-muted-foreground">The song will be ready and delivered to your email</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-left">
            <Download className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Download Link</p>
              <p className="text-xs text-muted-foreground">Check your inbox for the download link once ready</p>
            </div>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="w-full">
            Create Another Song
          </Button>
        </Link>
      </Card>
    </div>
  );
}
