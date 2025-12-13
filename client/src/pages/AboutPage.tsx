import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, FileText, Shield, Award, MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearAuthState } from "@/hooks/useAuth";
import { userService } from "@/lib/supabase-service";

interface AboutItem {
  id: string;
  label: string;
  icon: typeof FileText;
  path: string;
}

const aboutItems: AboutItem[] = [
  { id: "terms", label: "Terms & Conditions", icon: FileText, path: "/terms" },
  { id: "privacy", label: "Privacy Policy", icon: Shield, path: "/privacy" },
  { id: "licenses", label: "Licenses and Registration", icon: Award, path: "/licenses" },
];

const deleteReasons = [
  { id: "not-using", label: "I'm not using this app anymore" },
  { id: "found-alternative", label: "I found a better alternative" },
  { id: "privacy-concerns", label: "Privacy concerns" },
  { id: "too-many-notifications", label: "Too many notifications" },
  { id: "poor-experience", label: "Poor user experience" },
  { id: "technical-issues", label: "Technical issues with the app" },
  { id: "other", label: "Other reason" },
];

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "We'd like to know why you're leaving to improve our service.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteAccount(selectedReason);
      clearAuthState();
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 pt-16 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/profile")}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="text-page-title"
            >
              About
            </h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                data-testid="button-menu"
              >
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="button-delete-account"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {aboutItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                index < aboutItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid={`button-${item.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-800 font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
            Plattr by Hostify Technologies Pvt. Ltd.
          </p>
          <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "Sweet Sans Pro" }}>
            Version 1.0.0
          </p>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <AlertDialogTitle 
                className="text-xl font-semibold"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Delete Account
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription 
              className="text-gray-600 text-left"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Are you sure you want to delete your account? This action cannot be undone.
              <span className="block mt-2 text-red-600 font-medium">
                All your order history, saved addresses, preferences, and other account details will be permanently deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <p 
              className="text-sm font-medium text-gray-700 mb-3"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Please tell us why you're leaving:
            </p>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {deleteReasons.map((reason) => (
                <div 
                  key={reason.id} 
                  className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label 
                    htmlFor={reason.id} 
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={!selectedReason || isDeleting}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
            </Button>
            <AlertDialogCancel 
              className="w-full mt-0 bg-[#22C55E] text-white hover:bg-[#16A34A] border-0"
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
