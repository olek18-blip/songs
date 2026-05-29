import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Zap, Video, FileAudio, ArrowRight, ArrowLeft, Mail, Star, Play, CreditCard, Check, Crown, Sparkles, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const GENRES = [
  "Pop", "Rock", "Reggaeton", "Hip-Hop", "Jazz", "R&B",
  "Country", "Electronic", "Classical", "Latin", "Indie", "Folk"
];

const TIERS = {
  basic: { name: "Basic", price: 5.00, description: "Quick & fun song", icon: Music, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  premium: { name: "Premium", price: 14.99, description: "Deeply personal & detailed", icon: Crown, color: "text-primary", bgColor: "bg-primary/10" },
  ultra: { name: "Ultra", price: 24.99, description: "Maximum personalization", icon: Sparkles, color: "text-purple-400", bgColor: "bg-purple-500/10" },
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0); // 0=hero, 1=email, 2=tier, 3=details, 4=upsells
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"basic" | "premium" | "ultra">("premium");
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [anecdotes, setAnecdotes] = useState("");
  const [genre, setGenre] = useState("");
  // Premium fields
  const [personalityTraits, setPersonalityTraits] = useState("");
  const [relationship, setRelationship] = useState("");
  // Ultra fields
  const [tonePreference, setTonePreference] = useState("");
  const [specificPhrases, setSpecificPhrases] = useState("");
  const [dedications, setDedications] = useState("");
  // Upsells
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [lyricVideo, setLyricVideo] = useState(false);
  const [wavFile, setWavFile] = useState(false);
  const [revisionsIncluded, setRevisionsIncluded] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  const totalPrice = useMemo(() => {
    let total = TIERS[tier].price;
    if (expressDelivery) total += 9;
    if (lyricVideo) total += 15;
    if (wavFile) total += 5;
    if (revisionsIncluded === 1) total += 4.99;
    if (revisionsIncluded === 2) total += 7.99;
    return total;
  }, [tier, expressDelivery, lyricVideo, wavFile, revisionsIncluded]);

  const saveLead = trpc.leads.save.useMutation();
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleEmailSubmit = async () => {
    if (!email) return;
    try {
      await saveLead.mutateAsync({ email });
    } catch (e) {}
    setCurrentStep(2);
  };

  const handleTierSelect = () => {
    saveLead.mutate({ email, tier, lastStep: 2 });
    setCurrentStep(3);
  };

  const handleDetailsSubmit = async () => {
    if (!recipientName || !genre) return;
    try {
      await saveLead.mutateAsync({ email, celebrantName: recipientName, anecdotes, genre, tier, lastStep: 3 });
    } catch (e) {}
    setCurrentStep(4);
  };

  const handleCheckout = () => {
    createOrder.mutate({
      customerEmail: email,
      celebrantName: recipientName,
      occasion: occasion || undefined,
      anecdotes,
      genre,
      tier,
      personalityTraits: personalityTraits || undefined,
      relationship: relationship || undefined,
      tonePreference: tonePreference || undefined,
      specificPhrases: specificPhrases || undefined,
      dedications: dedications || undefined,
      expressDelivery,
      lyricVideo,
      wavFile,
      revisionsIncluded,
      couponCode: couponCode || undefined,
    });
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">SongForge<span className="text-primary">AI</span></span>
          </div>
          {currentStep === 0 && (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold text-xs font-semibold"
              onClick={() => setCurrentStep(1)}
            >
              Create Song
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      {currentStep === 0 && (
        <section className="relative min-h-screen flex items-center justify-center pt-14 noise-overlay">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          
          <div className="relative z-10 container text-center max-w-4xl mx-auto px-4">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" /> AI-Powered Music Generation
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              The Ultimate Personalized{" "}
              <span className="text-gradient-gold">Birthday Song</span>{" "}
              in 60 Seconds
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Give them a gift they'll never forget. Our AI composes a unique, professional-quality song 
              using their name, memories, and your chosen style. <strong className="text-foreground">Delivered to your inbox.</strong>
            </p>
            
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold text-lg px-10 py-7 font-bold rounded-xl transition-all duration-200 active:scale-[0.97]"
              onClick={() => setCurrentStep(1)}
            >
              Create Your Song Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Starting at <span className="text-primary font-semibold">5 €</span> · No account needed · Instant delivery available
            </p>

            {/* Quick stats */}
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">12K+</p>
                <p className="text-xs text-muted-foreground">Songs Created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">4.9★</p>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">&lt;1h</p>
                <p className="text-xs text-muted-foreground">Express Delivery</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 bg-primary/60 rounded-full" />
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      {currentStep === 0 && (
        <section className="py-20 bg-secondary/20 relative">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-center text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Real Reactions, Real Emotions
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-sm">
              See how people react when they hear their personalized song for the first time
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { name: "María", views: "2.4M", emoji: "😭" },
                { name: "Carlos", views: "1.8M", emoji: "🥹" },
                { name: "Ana", views: "956K", emoji: "💕" },
                { name: "Diego", views: "3.1M", emoji: "🎉" },
              ].map((item, i) => (
                <div key={i} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-b from-muted/50 to-muted group cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3"><span className="text-2xl">{item.emoji}</span></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-medium">@{item.name.toLowerCase()}_reaction</p>
                    <p className="text-white/70 text-[10px]">{item.views} views</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {[
                "Mi madre lloró de emoción 😭",
                "Mejor regalo que he hecho jamás",
                "La calidad es increíble, parece profesional",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-full px-4 py-2">
                  <div className="flex">{[...Array(5)].map((_, j) => (<Star key={j} className="w-3 h-3 fill-primary text-primary" />))}</div>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      {currentStep === 0 && (
        <section className="py-20 relative">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12" style={{ fontFamily: "var(--font-heading)" }}>
              Three Steps. One Unforgettable Gift.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Mail, title: "Tell Us About Them", desc: "Share their name, a few fun anecdotes, and pick a music style." },
                { icon: Music, title: "AI Composes", desc: "Our AI crafts a unique, professional-quality song in minutes." },
                { icon: Zap, title: "Instant Delivery", desc: "Download your song or get it delivered in under 1 hour." },
              ].map((step, i) => (
                <div key={i} className="text-center group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold px-8 py-6 rounded-xl transition-all duration-200 active:scale-[0.97]" onClick={() => setCurrentStep(1)}>
                Start Creating <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* FUNNEL: Multi-step Form */}
      {currentStep >= 1 && (
        <section className="min-h-screen pt-20 pb-12 flex items-center justify-center relative noise-overlay">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
          
          <div className="relative z-10 container max-w-lg mx-auto px-4">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Step {currentStep} of {totalSteps}</span>
                <span className="text-xs text-primary font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
              </div>
            </div>

            {/* Step 1: Email Capture */}
            {currentStep === 1 && (
              <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Let's Get Started</h2>
                  <p className="text-sm text-muted-foreground">Enter your email to save your progress and receive your song</p>
                </div>
                <div className="space-y-4">
                  <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-base bg-input/50 border-border/50 focus:border-primary" autoFocus />
                  <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base glow-gold transition-all duration-200 active:scale-[0.97]" onClick={handleEmailSubmit} disabled={!email || !email.includes("@")}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center mt-4">We'll only use this to deliver your song. No spam, ever.</p>
              </Card>
            )}

            {/* Step 2: Tier Selection */}
            {currentStep === 2 && (
              <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Choose Your Experience</h2>
                  <p className="text-sm text-muted-foreground">More details = more personal song. Pick the level that fits.</p>
                </div>
                <div className="space-y-3">
                  {(Object.entries(TIERS) as [keyof typeof TIERS, typeof TIERS[keyof typeof TIERS]][]).map(([key, t]) => (
                    <div
                      key={key}
                      onClick={() => setTier(key)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        tier === key
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      {key === "premium" && (
                        <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">Most Popular</Badge>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${t.bgColor} flex items-center justify-center`}>
                          <t.icon className={`w-5 h-5 ${t.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{t.name}</p>
                            <p className="font-bold text-primary">{t.price} €</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </div>
                      {/* Feature list per tier */}
                      <div className="mt-3 pl-13 text-xs text-muted-foreground space-y-1">
                        {key === "basic" && (
                          <>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Name + occasion + genre</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Quick 2-3 anecdotes</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> AI-generated song (MP3)</p>
                          </>
                        )}
                        {key === "premium" && (
                          <>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Everything in Basic</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Personality traits & relationship</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Deeper, more emotional lyrics</p>
                          </>
                        )}
                        {key === "ultra" && (
                          <>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Everything in Premium</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Tone preferences & specific phrases</p>
                            <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-400" /> Custom dedications & maximum detail</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button className="flex-[2] h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-gold transition-all duration-200 active:scale-[0.97]" onClick={handleTierSelect}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Song Details (varies by tier) */}
            {currentStep === 3 && (
              <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Tell Us About Them</h2>
                  <p className="text-sm text-muted-foreground">
                    {tier === "basic" ? "Quick details for a fun song" : tier === "premium" ? "The more you share, the more personal the song" : "Maximum detail for the ultimate personalized experience"}
                  </p>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* All tiers: Name */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Recipient's Name</label>
                    <Input placeholder="e.g., María, Carlos, Papá..." value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="h-11 bg-input/50 border-border/50 focus:border-primary" autoFocus />
                  </div>
                  
                  {/* All tiers: Occasion */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Occasion</label>
                    <Select value={occasion} onValueChange={setOccasion}>
                      <SelectTrigger className="h-11 bg-input/50 border-border/50"><SelectValue placeholder="Select occasion..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="graduation">Graduation</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="other">Other Celebration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* All tiers: Anecdotes */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {tier === "basic" ? "1-2 Quick Anecdotes" : "2-3 Key Anecdotes"}
                    </label>
                    <Textarea
                      placeholder="Share funny stories, inside jokes, memorable moments..."
                      value={anecdotes}
                      onChange={(e) => setAnecdotes(e.target.value)}
                      className={`bg-input/50 border-border/50 focus:border-primary resize-none ${tier === "basic" ? "min-h-[80px]" : "min-h-[120px]"}`}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Example: "She always burns the toast", "He can't stop quoting The Office"</p>
                  </div>
                  
                  {/* All tiers: Genre */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Musical Genre</label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="h-11 bg-input/50 border-border/50"><SelectValue placeholder="Choose a style..." /></SelectTrigger>
                      <SelectContent>{GENRES.map((g) => (<SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>

                  {/* Premium & Ultra: Personality + Relationship */}
                  {(tier === "premium" || tier === "ultra") && (
                    <>
                      <div className="pt-2 border-t border-border/30">
                        <Badge variant="secondary" className="mb-3 text-[10px] bg-primary/10 text-primary">Premium Details</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Personality Traits</label>
                        <Input placeholder="e.g., funny, adventurous, always late, loves cooking..." value={personalityTraits} onChange={(e) => setPersonalityTraits(e.target.value)} className="h-11 bg-input/50 border-border/50 focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Your Relationship</label>
                        <Select value={relationship} onValueChange={setRelationship}>
                          <SelectTrigger className="h-11 bg-input/50 border-border/50"><SelectValue placeholder="How do you know them?" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="partner">Partner / Spouse</SelectItem>
                            <SelectItem value="friend">Best Friend</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="child">Son / Daughter</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Ultra only: Tone, Phrases, Dedications */}
                  {tier === "ultra" && (
                    <>
                      <div className="pt-2 border-t border-border/30">
                        <Badge variant="secondary" className="mb-3 text-[10px] bg-purple-500/10 text-purple-400">Ultra Details</Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Tone Preference</label>
                        <Select value={tonePreference} onValueChange={setTonePreference}>
                          <SelectTrigger className="h-11 bg-input/50 border-border/50"><SelectValue placeholder="What vibe should the song have?" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="funny">Funny & Lighthearted</SelectItem>
                            <SelectItem value="emotional">Emotional & Touching</SelectItem>
                            <SelectItem value="epic">Epic & Celebratory</SelectItem>
                            <SelectItem value="romantic">Romantic & Sweet</SelectItem>
                            <SelectItem value="nostalgic">Nostalgic & Reflective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Specific Phrases to Include</label>
                        <Textarea placeholder="Any specific words, quotes, or phrases you want in the song..." value={specificPhrases} onChange={(e) => setSpecificPhrases(e.target.value)} className="min-h-[80px] bg-input/50 border-border/50 focus:border-primary resize-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Special Dedication</label>
                        <Textarea placeholder="A personal message or dedication to include..." value={dedications} onChange={(e) => setDedications(e.target.value)} className="min-h-[60px] bg-input/50 border-border/50 focus:border-primary resize-none" />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-11" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button className="flex-[2] h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-gold transition-all duration-200 active:scale-[0.97]" onClick={handleDetailsSubmit} disabled={!recipientName || !genre}>
                    Choose Extras <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Upsells & Checkout */}
            {currentStep === 4 && (
              <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Customize Your Package</h2>
                  <p className="text-sm text-muted-foreground">Add extras to make it even more special</p>
                </div>
                
                {/* Base product (tier) */}
                <div className="bg-secondary/50 rounded-xl p-4 mb-4 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${TIERS[tier].bgColor} flex items-center justify-center`}>
                        {tier === "basic" && <Music className="w-5 h-5 text-blue-400" />}
                        {tier === "premium" && <Crown className="w-5 h-5 text-primary" />}
                        {tier === "ultra" && <Sparkles className="w-5 h-5 text-purple-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{TIERS[tier].name} Song (MP3)</p>
                        <p className="text-xs text-muted-foreground">Delivered in 48h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{TIERS[tier].price} €</span>
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Upsells */}
                <div className="space-y-3 mb-4">
                  {/* Express */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Express 1-Hour Delivery</p>
                        <p className="text-xs text-muted-foreground">Skip the queue, get it fast</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">+9 €</span>
                      <Switch checked={expressDelivery} onCheckedChange={setExpressDelivery} />
                    </div>
                  </div>

                  {/* Lyric Video */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Lyric Video</p>
                        <p className="text-xs text-muted-foreground">Cinematic AI visuals for TikTok/Reels</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">+15 €</span>
                      <Switch checked={lyricVideo} onCheckedChange={setLyricVideo} />
                    </div>
                  </div>

                  {/* WAV */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileAudio className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Uncompressed WAV</p>
                        <p className="text-xs text-muted-foreground">Studio quality for speakers & events</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">+5 €</span>
                      <Switch checked={wavFile} onCheckedChange={setWavFile} />
                    </div>
                  </div>

                  {/* Revisions */}
                  <div className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Revision Passes</p>
                        <p className="text-xs text-muted-foreground">Request changes after hearing your song</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pl-13">
                      <Button
                        size="sm"
                        variant={revisionsIncluded === 0 ? "default" : "outline"}
                        className={`text-xs h-8 ${revisionsIncluded === 0 ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => setRevisionsIncluded(0)}
                      >
                        None
                      </Button>
                      <Button
                        size="sm"
                        variant={revisionsIncluded === 1 ? "default" : "outline"}
                        className={`text-xs h-8 ${revisionsIncluded === 1 ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => setRevisionsIncluded(1)}
                      >
                        1 Revision (+4.99 €)
                      </Button>
                      <Button
                        size="sm"
                        variant={revisionsIncluded === 2 ? "default" : "outline"}
                        className={`text-xs h-8 ${revisionsIncluded === 2 ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => setRevisionsIncluded(2)}
                      >
                        2 Revisions (+7.99 €)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Discount code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="h-10 bg-input/50 border-border/50 text-sm" />
                  <Button variant="outline" size="sm" className="h-10 px-4 text-xs">Apply</Button>
                </div>

                {/* Payment */}
                <div className="space-y-3 mb-4">
                  <Button
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base glow-gold transition-all duration-200 active:scale-[0.97]"
                    onClick={handleCheckout}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? "Processing..." : <><CreditCard className="mr-2 w-4 h-4" /> Pay {totalPrice.toFixed(2)} €</>}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">Apple Pay & Google Pay available at checkout</p>
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                  <span>🔒 Secure payment</span><span>·</span><span>No account needed</span><span>·</span><span>Instant confirmation</span>
                </div>

                <div className="mt-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="mr-1 w-3 h-3" /> Edit details
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">© 2026 SongForgeAI. All rights reserved. Powered by artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
