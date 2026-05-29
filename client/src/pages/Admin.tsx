import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, Users, TrendingUp, Music, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

function SetupRetargetingButton() {
  const setupMutation = trpc.heartbeat.setupRetargeting.useMutation({
    onSuccess: (data) => {
      alert(`Cron job created! Task UID: ${data.taskUid}. Next execution: ${data.nextExecution || "soon"}`);
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });
  return (
    <Button
      onClick={() => setupMutation.mutate()}
      disabled={setupMutation.isPending}
      className="bg-primary text-primary-foreground"
      size="sm"
    >
      {setupMutation.isPending ? "Setting up..." : "Activate Retargeting Cron (Hourly)"}
    </Button>
  );
}

function CronJobsList() {
  const jobsQuery = trpc.heartbeat.list.useQuery();
  if (jobsQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!jobsQuery.data || jobsQuery.data.length === 0) return <p className="text-sm text-muted-foreground">No active cron jobs.</p>;
  return (
    <div className="space-y-2">
      {jobsQuery.data.map((job) => (
        <div key={job.taskUid} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">{job.name}</p>
            <p className="text-xs text-muted-foreground">{job.cronExpression} · {job.callbackPath}</p>
          </div>
          <Badge variant={job.isEnable ? "default" : "secondary"} className="text-xs">
            {job.isEnable ? "Active" : "Paused"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const orderStats = trpc.orders.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const leadStats = trpc.leads.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const ordersList = trpc.orders.list.useQuery(
    { limit: 50, offset: 0, status: statusFilter as any },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const leadsList = trpc.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const b2bList = trpc.b2b.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please log in to access the admin panel.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground">Log In</Button>
          </a>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <h1 className="font-bold text-lg">
              <Music className="w-4 h-4 inline mr-2 text-primary" />
              Admin Panel
            </h1>
          </div>
          <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
        </div>
      </header>

      <main className="container py-8 max-w-6xl mx-auto px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderStats.data?.totalOrders ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Number(orderStats.data?.totalRevenue ?? 0).toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leadStats.data?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Leads Captured</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {leadStats.data?.total ? Math.round(((leadStats.data?.converted ?? 0) / leadStats.data.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="b2b">B2B Contacts</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Orders</h3>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {ordersList.data?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No orders yet.</p>
              )}
              {ordersList.data?.map((order) => (
                <Card key={order.id} className="p-4 bg-card/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        #{order.id} — Song for <span className="text-primary">{order.celebrantName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail} · {order.genre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">
                        {order.paymentStatus}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {order.generationStatus}
                      </Badge>
                      <span className="font-bold text-sm">{order.totalPrice} €</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leads">
            <h3 className="font-semibold mb-4">Captured Leads</h3>
            <div className="space-y-2">
              {leadsList.data?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No leads captured yet.</p>
              )}
              {leadsList.data?.map((lead) => (
                <Card key={lead.id} className="p-4 bg-card/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Step {lead.lastStep} · {lead.celebrantName ? `For: ${lead.celebrantName}` : "No name yet"}
                        {lead.genre ? ` · ${lead.genre}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.converted ? (
                        <Badge className="text-xs bg-green-500/20 text-green-400">Converted</Badge>
                      ) : lead.retargetingSent ? (
                        <Badge variant="secondary" className="text-xs">Retargeted</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">Abandoned</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <h3 className="font-semibold mb-4">Testing Mode</h3>
            <Card className="p-6 bg-card/80 mb-4 border border-yellow-500/30">
              <h4 className="font-medium mb-2 text-yellow-400">Admin Test Orders</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create test orders without payment to verify song generation, emails, and revisions.
              </p>
              <p className="text-sm text-muted-foreground">Test mode coming soon - allows creating orders without Stripe payment for testing.</p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <h3 className="font-semibold mb-4">Scheduled Jobs & Configuration</h3>
            <Card className="p-6 bg-card/80 mb-4">
              <h4 className="font-medium mb-2">Abandoned Cart Retargeting</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Runs every hour to find leads who started the form but didn't purchase. Sends them a 20% discount coupon email.
              </p>
              <SetupRetargetingButton />
            </Card>
            <Card className="p-6 bg-card/80">
              <h4 className="font-medium mb-2">Active Cron Jobs</h4>
              <CronJobsList />
            </Card>
          </TabsContent>

          <TabsContent value="b2b">
            <h3 className="font-semibold mb-4">B2B Inquiries</h3>
            <div className="space-y-2">
              {b2bList.data?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No B2B inquiries yet.</p>
              )}
              {b2bList.data?.map((contact) => (
                <Card key={contact.id} className="p-4 bg-card/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{contact.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.contactName} · {contact.email}
                        {contact.employeeCount ? ` · ${contact.employeeCount} employees` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{contact.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
