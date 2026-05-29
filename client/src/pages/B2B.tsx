import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Building2, Users, Zap, Check, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";

export default function B2B() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitB2b = trpc.b2b.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thank you! We'll be in touch within 24 hours.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!companyName || !contactName || !email) return;
    submitB2b.mutate({ companyName, contactName, email, phone, employeeCount, message });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">SongForge<span className="text-primary">AI</span></span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 relative noise-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        
        <div className="relative z-10 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
              <Building2 className="w-3 h-3 mr-1" /> Enterprise Solution
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Personalized Birthday Songs{" "}
              <span className="text-gradient-gold">for Every Employee</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Boost employee engagement with AI-generated personalized birthday songs. 
              Automated, scalable, and unforgettable.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Zap, title: "Fully Automated", desc: "Integrates with your HR system. Songs generated and delivered automatically on each employee's birthday." },
              { icon: Users, title: "Scales to Any Size", desc: "From 50 to 50,000 employees. One annual subscription covers everyone." },
              { icon: Music, title: "Truly Personal", desc: "Each song is unique, incorporating the employee's name and team-specific details." },
            ].map((item, i) => (
              <Card key={i} className="p-6 bg-card/80 border-border/50">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* Pricing hint */}
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-2">Annual plans starting at</p>
            <p className="text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              2.99 € <span className="text-lg text-muted-foreground font-normal">/ employee / year</span>
            </p>
          </div>

          {/* Contact Form */}
          {!submitted ? (
            <Card className="max-w-lg mx-auto p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
              <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "var(--font-heading)" }}>
                Get a Custom Quote
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Company Name *</label>
                    <Input
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-11 bg-input/50 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Contact Name *</label>
                    <Input
                      placeholder="John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-11 bg-input/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Work Email *</label>
                    <Input
                      type="email"
                      placeholder="john@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-input/50 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input
                      placeholder="+34 600 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 bg-input/50 border-border/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Number of Employees</label>
                  <Select value={employeeCount} onValueChange={setEmployeeCount}>
                    <SelectTrigger className="h-11 bg-input/50 border-border/50">
                      <SelectValue placeholder="Select range..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10-50">10-50</SelectItem>
                      <SelectItem value="50-200">50-200</SelectItem>
                      <SelectItem value="200-500">200-500</SelectItem>
                      <SelectItem value="500-1000">500-1,000</SelectItem>
                      <SelectItem value="1000+">1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
                  <Textarea
                    placeholder="Tell us about your needs..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[80px] bg-input/50 border-border/50 resize-none"
                  />
                </div>
                <Button
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base glow-gold transition-all duration-200 active:scale-[0.97]"
                  onClick={handleSubmit}
                  disabled={!companyName || !contactName || !email || submitB2b.isPending}
                >
                  {submitB2b.isPending ? "Sending..." : "Request a Demo"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="max-w-lg mx-auto p-8 bg-card/80 backdrop-blur-sm border-border/50 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground">
                We've received your inquiry. Our team will reach out within 24 hours with a custom proposal.
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 SongForgeAI. All rights reserved. Powered by artificial intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
