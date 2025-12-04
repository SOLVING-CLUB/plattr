import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { User, Settings, CreditCard, MapPin, LogOut, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary px-4 pt-12 pb-8 text-primary-foreground">
        <div className="flex items-center gap-4 container max-w-md mx-auto">
          <Avatar className="w-20 h-20 border-4 border-white/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Guest User</h1>
            <p className="text-primary-foreground/80 text-sm">+91 98765 43210</p>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 font-bold text-lg border-b">Account Settings</div>
          <div className="divide-y">
            {[
              { icon: User, label: 'Edit Profile' },
              { icon: MapPin, label: 'Saved Addresses' },
              { icon: CreditCard, label: 'Payment Methods' },
              { icon: Settings, label: 'Notifications' },
            ].map((item, i) => (
              <Button key={i} variant="ghost" className="w-full justify-between h-14 px-4 hover:bg-muted/50 rounded-none">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20 font-bold">
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </main>
      
      <MobileNav />
    </div>
  );
}
