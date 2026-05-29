import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Mail, Phone, User, MessageSquare, Music, Download, Loader2 } from "lucide-react";

export default function UserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Fetch user's orders
  const { data: orders = [], isLoading: ordersLoading } = trpc.orders.getUserOrders.useQuery(
    { email: user?.email || "" },
    { enabled: !!user?.email }
  );

  // Fetch communications for selected order
  const { data: communications = [], isLoading: commsLoading } = trpc.songComm.list.useQuery(
    { orderId: selectedOrderId || 0 },
    { enabled: !!selectedOrderId }
  );

  const saveProfileMutation = trpc.userProfile.save.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const sendMessageMutation = trpc.songComm.send.useMutation({
    onSuccess: () => {
      toast.success("Message sent to admin");
      setMessage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      {/* Profile Info */}
      <Card className="p-6 mb-8 bg-card border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input value={user.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input value={user.name || ""} disabled className="bg-muted" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone (for communication)</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              type="tel"
            />
          </div>
          <Button
            onClick={() => saveProfileMutation.mutate({ phone: phone || undefined })}
            disabled={saveProfileMutation.isPending}
          >
            {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>

      {/* Your Orders */}
      <Card className="p-6 mb-8 bg-card border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5" />
          Your Orders
        </h2>
        {ordersLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet. Create your first song!</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedOrderId === order.id
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/50 border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Song for {order.celebrantName}</p>
                    <p className="text-sm text-muted-foreground">{order.genre} • {order.tier}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.totalPrice}€</p>
                    <p className={`text-sm ${
                      order.paymentStatus === "paid" ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {order.paymentStatus}
                    </p>
                    {order.audioUrl && (
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Communication */}
      {selectedOrderId && (
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication
          </h2>

          {/* Messages */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
            {commsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
            ) : communications.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet. Send a message to request changes.</p>
            ) : (
              communications.map((comm: any) => (
                <div key={comm.id} className={`p-3 rounded ${
                  comm.senderType === "customer" ? "bg-primary/20 ml-8" : "bg-secondary/20 mr-8"
                }`}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {comm.senderType === "customer" ? "You" : "Admin"}
                  </p>
                  <p className="text-sm">{comm.message}</p>
                  {comm.attachmentUrl && (
                    <a href={comm.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-2 block">
                      📎 Download revision
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Send Message */}
          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Request changes or ask questions about your song..."
              className="min-h-24"
            />
            <Button
              disabled={sendMessageMutation.isPending}
              onClick={() => {
                if (!message.trim()) {
                  toast.error("Please enter a message");
                  return;
                }
                sendMessageMutation.mutate({
                  orderId: selectedOrderId,
                  customerEmail: user?.email || "",
                  message: message.trim(),
                });
              }}
              className="w-full"
            >
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
