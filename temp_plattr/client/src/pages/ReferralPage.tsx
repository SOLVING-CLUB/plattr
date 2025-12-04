import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gift, UserPlus, CheckCircle, Wallet, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ReferralPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('referral');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    friendName: '',
    friendPhone: '',
    eventDetails: ''
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'categories') {
      setLocation('/categories/tiffins');
    } else if (tab === 'orders') {
      setLocation('/orders');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Referral Submitted!",
      description: "We'll verify the details and get in touch soon.",
    });
    setFormData({ friendName: '', friendPhone: '', eventDetails: '' });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader 
        cartItemCount={0}
        onCartClick={() => setLocation('/cart')}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => setLocation('/')}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-2xl p-8 mb-8 text-center border border-primary/20">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Refer and get up to 10% of the order value as rewards!</h1>
          <Button 
            size="lg" 
            className="mt-4 rounded-full px-8"
            onClick={() => setShowForm(!showForm)}
            data-testid="button-submit-referral"
          >
            Submit a Referral
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Referral Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="friendName">Friend's Name *</Label>
                <Input
                  id="friendName"
                  value={formData.friendName}
                  onChange={(e) => setFormData({ ...formData, friendName: e.target.value })}
                  placeholder="Enter their name"
                  required
                  data-testid="input-friend-name"
                />
              </div>

              <div>
                <Label htmlFor="friendPhone">Friend's Phone Number *</Label>
                <Input
                  id="friendPhone"
                  type="tel"
                  value={formData.friendPhone}
                  onChange={(e) => setFormData({ ...formData, friendPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                  data-testid="input-friend-phone"
                />
              </div>

              <div>
                <Label htmlFor="eventDetails">Event Details *</Label>
                <Textarea
                  id="eventDetails"
                  value={formData.eventDetails}
                  onChange={(e) => setFormData({ ...formData, eventDetails: e.target.value })}
                  placeholder="Tell us about the event (date, type, guest count, etc.)"
                  rows={4}
                  required
                  data-testid="textarea-event-details"
                />
              </div>

              <Button type="submit" className="w-full" data-testid="button-submit-referral-form">
                Submit Referral
              </Button>
            </form>
          </Card>
        )}

        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Rewards</p>
                <p className="text-3xl font-bold">0</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </div>
        </Card>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">How it works?</h2>
            <Button variant="ghost" size="sm" data-testid="button-faqs">FAQ's</Button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 1: Submit a Referral</h3>
                <p className="text-muted-foreground">
                  Share your friends' or acquaintances' event details if they are struggling to find a caterer. Click "Submit a Referral" above to get started.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 2: Verification</h3>
                <p className="text-muted-foreground">
                  Our team will verify the details submitted to ensure the event is eligible for rewards.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 3: Earn Rewards</h3>
                <p className="text-muted-foreground">
                  Receive up to 10% of the order value in your wallet after the order is completed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-3">Example</h3>
          <p className="text-muted-foreground">
            If your friend books catering worth ₹50,000, you'll receive ₹5,000 (10%) in your rewards wallet once the event is successfully completed!
          </p>
        </div>
      </main>

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={0}
      />
    </div>
  );
}
