import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Pause, Download, RotateCcw, ArrowLeft, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

export default function OrderStatus() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const orderQuery = trpc.orders.status.useQuery(
    { email, orderId: parseInt(orderId) || 0 },
    { enabled: searched && !!email && !!orderId }
  );

  const requestRevision = trpc.orders.requestRevision.useMutation({
    onSuccess: (data) => {
      toast.success(`Revision requested! ${data.revisionsRemaining} revision(s) remaining.`);
      setRevisionNotes("");
      orderQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSearch = () => {
    if (!email || !orderId) return;
    setSearched(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const order = orderQuery.data;

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    queued: { label: "In Queue", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
    generating: { label: "Generating...", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Loader2 },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 },
    failed: { label: "Failed", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: Clock },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Music className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg tracking-tight">SongForge<span className="text-primary">AI</span></span>
            </div>
          </Link>
        </div>
      </header>

      <main className="pt-20 pb-12 container max-w-lg mx-auto px-4">
        {!searched || !order ? (
          <Card className="p-6 sm:p-8 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Check Your Order</h2>
              <p className="text-sm text-muted-foreground">Enter your email and order ID to view your song status</p>
            </div>
            <div className="space-y-4">
              <Input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 bg-input/50 border-border/50 focus:border-primary" />
              <Input type="text" placeholder="Order ID (from your confirmation email)" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="h-11 bg-input/50 border-border/50 focus:border-primary" />
              <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={handleSearch} disabled={!email || !orderId}>
                Find My Order
              </Button>
            </div>
            {orderQuery.error && searched && (
              <p className="text-sm text-red-400 text-center mt-4">Order not found. Please check your email and order ID.</p>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Order Info */}
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order #{order.id}</h2>
                <Badge className={`${statusConfig[order.generationStatus]?.color || ""} border`}>
                  {statusConfig[order.generationStatus]?.label || order.generationStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Recipient</p>
                  <p className="font-medium">{order.celebrantName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Genre</p>
                  <p className="font-medium capitalize">{order.genre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tier</p>
                  <p className="font-medium capitalize">{order.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            {/* Audio Preview */}
            {order.previewUrl && (
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" /> Song Preview (30s)
                </h3>
                <div className="bg-secondary/50 rounded-xl p-4 flex items-center gap-4">
                  <Button size="sm" variant="outline" className="w-10 h-10 rounded-full p-0" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-0 transition-all" id="progress-bar" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">30-second preview</p>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={order.previewUrl}
                  onEnded={() => setIsPlaying(false)}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                      const bar = document.getElementById("progress-bar");
                      if (bar) bar.style.width = `${progress}%`;
                    }
                  }}
                />
              </Card>
            )}

            {/* Download Links */}
            {order.generationStatus === "completed" && (order.mp3Url || order.wavUrl || order.videoUrl) && (
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" /> Your Files
                </h3>
                <div className="space-y-2">
                  {order.mp3Url && (
                    <a href={order.mp3Url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                      <Music className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Download MP3</span>
                    </a>
                  )}
                  {order.wavUrl && (
                    <a href={order.wavUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                      <Music className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Download WAV (Uncompressed)</span>
                    </a>
                  )}
                  {order.videoUrl && (
                    <a href={order.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                      <Play className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">Download Lyric Video</span>
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Revision Request */}
            {order.generationStatus === "completed" && order.revisionsIncluded > 0 && order.revisionsUsed < order.revisionsIncluded && (
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-green-400" /> Request a Revision
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  You have {order.revisionsIncluded - order.revisionsUsed} revision(s) remaining. Tell us what you'd like changed.
                </p>
                <Textarea
                  placeholder="Describe what you'd like to change (e.g., 'Make it more upbeat', 'Change the chorus melody', 'Add more references to their love of cooking')..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="min-h-[100px] bg-input/50 border-border/50 focus:border-primary resize-none mb-3"
                />
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={() => requestRevision.mutate({ email, orderId: parseInt(orderId), notes: revisionNotes })}
                  disabled={revisionNotes.length < 10 || requestRevision.isPending}
                >
                  {requestRevision.isPending ? "Submitting..." : "Submit Revision Request"}
                </Button>
              </Card>
            )}

            {/* Back */}
            <div className="text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="mr-1 w-3 h-3" /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
