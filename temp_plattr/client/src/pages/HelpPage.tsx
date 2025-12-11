import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function HelpPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('help');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bestTimeToCall: '',
    message: ''
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
    
    if (!formData.bestTimeToCall) {
      toast({
        title: "Missing Information",
        description: "Please select your preferred time to call.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Request Submitted",
      description: "We'll get back to you soon!",
    });
    setFormData({ name: '', phone: '', bestTimeToCall: '', message: '' });
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Get Help</h1>
          <p className="text-muted-foreground">We're here to assist you with any questions or concerns</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">support@cateringservice.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">123 MG Road, Bangalore, Karnataka 560001</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-muted-foreground">Mon - Sat: 9:00 AM - 8:00 PM</p>
                    <p className="text-muted-foreground">Sun: 10:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Request a Callback</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="bestTime">Best Time to Call *</Label>
                <Select
                  value={formData.bestTimeToCall}
                  onValueChange={(value) => setFormData({ ...formData, bestTimeToCall: value })}
                  required
                >
                  <SelectTrigger data-testid="select-best-time">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                    <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  rows={4}
                  data-testid="textarea-message"
                />
              </div>

              <Button type="submit" className="w-full" data-testid="button-submit-help">
                Submit Request
              </Button>
            </form>
          </div>
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
