import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";

import sunburstBg from "@assets/image 1684_1764063713649.png";

interface Address {
  id: string;
  label: string;
  address: string;
  landmark: string | null;
  isDefault: boolean;
  userId: string;
}

type ModalState = "none" | "delete" | "add" | "edit";

export default function SavedAddresses() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");
  
  const [formData, setFormData] = useState({
    label: "",
    address: "",
    landmark: "",
    isDefault: false
  });

  // Fetch addresses
  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: { label: string; address: string; landmark?: string; isDefault: boolean }) => {
      return addressService.create(addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Address Added",
        description: "Your address has been saved successfully",
      });
      setModalState("none");
      setFormData({ label: "", address: "", landmark: "", isDefault: false });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create address",
        variant: "destructive",
      });
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, addressData }: { id: string; addressData: { label?: string; address?: string; landmark?: string; isDefault?: boolean } }) => {
      return addressService.update(id, addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Address Updated",
        description: "Your address has been updated successfully",
      });
      setModalState("none");
      setSelectedAddress(null);
      setFormData({ label: "", address: "", landmark: "", isDefault: false });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update address",
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return addressService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Address Deleted",
        description: "Your address has been deleted successfully",
      });
      setModalState("none");
      setSelectedAddress(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const filteredAddresses = addresses.filter(addr => 
    addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (addr.landmark && addr.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (address: Address) => {
    setSelectedAddress(address);
    setModalState("delete");
  };

  const confirmDelete = () => {
    if (selectedAddress) {
      deleteAddressMutation.mutate(selectedAddress.id);
    }
  };

  const handleEdit = (address: Address) => {
    setSelectedAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      landmark: address.landmark || "",
      isDefault: address.isDefault
    });
    setModalState("edit");
  };

  const handleAddNew = () => {
    setSelectedAddress(null);
    setFormData({
      label: "",
      address: "",
      landmark: "",
      isDefault: false
    });
    setModalState("add");
  };

  const handleSaveAddress = () => {
    if (!formData.label.trim() || !formData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (modalState === "edit" && selectedAddress) {
      updateAddressMutation.mutate({
        id: selectedAddress.id,
        addressData: {
          label: formData.label,
          address: formData.address,
          landmark: formData.landmark || null,
          isDefault: formData.isDefault
        }
      });
    } else if (modalState === "add") {
      createAddressMutation.mutate({
        label: formData.label,
        address: formData.address,
        landmark: formData.landmark || undefined,
        isDefault: formData.isDefault
      });
    }
  };

  const getFullAddress = (addr: Address) => {
    let full = addr.address;
    if (addr.landmark) {
      full += `, ${addr.landmark}`;
    }
    return full;
  };

  if (modalState === "add" || modalState === "edit") {
    return (
      <div className="min-h-screen bg-white relative pb-24">
        {/* Header */}
        <div className="px-5 pt-12 pb-4">
          <button 
            onClick={() => setModalState("none")}
            className="flex items-center gap-1 text-[#1A9952] mb-4"
            data-testid="button-back-addresses"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Saved Addresses</span>
          </button>

          {(modalState === "edit" || modalState === "add") && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
                Name of the Address
              </label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter Address Nickname (e.g., Home, Office)"
                className="w-full border-gray-200 rounded-lg py-3 px-4"
                data-testid="input-address-name"
              />
            </div>
          )}
        </div>

        {/* Form */}
        <div className="px-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
              Complete Address *
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Door No. 32, Jaya Prakash Nagar, Near Metro Station, Bengaluru, Karnataka 450003"
              className="w-full border-[#1A9952] rounded-lg py-3 px-4"
              data-testid="input-address"
            />
            <p className="text-xs text-gray-500 mt-1">Include street, area, city, state, and pincode</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1C1C] mb-2">
              Landmark (Optional)
            </label>
            <Input
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              placeholder="Near Metro Station, JP Nagar"
              className="w-full border-[#1A9952] rounded-lg py-3 px-4"
              data-testid="input-landmark"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-[#1A9952] border-gray-300 rounded focus:ring-[#1A9952]"
              data-testid="checkbox-default"
            />
            <label htmlFor="isDefault" className="text-sm text-[#1C1C1C]">
              Set as default address
            </label>
          </div>

          <Button
            onClick={handleSaveAddress}
            disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
            className="w-full bg-[#1A9952] hover:bg-[#158442] text-white py-6 rounded-lg font-semibold tracking-wider mt-4 disabled:opacity-50"
            data-testid="button-save-address"
          >
            {createAddressMutation.isPending || updateAddressMutation.isPending ? "SAVING..." : "SAVE ADDRESS"}
          </Button>
        </div>

        <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Sunburst Background */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <img
          src={sunburstBg}
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button 
          onClick={() => setLocation("/profile")}
          className="flex items-center gap-1 text-[#1A9952] mb-4"
          data-testid="button-back-profile"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Profile</span>
        </button>
        
        <h1 
          className="text-3xl font-bold text-[#1C1C1C] mb-4"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="text-page-title"
        >
          Saved Addresses
        </h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your saved addresses"
            className="w-full pl-10 border-gray-200 rounded-lg py-3 bg-white"
            data-testid="input-search-addresses"
          />
        </div>
      </div>

      {/* Address List */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredAddresses.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No addresses found. Add your first address!</p>
        </div>
      ) : (
      <div className="px-4 space-y-3">
        {filteredAddresses.map((address) => (
          <div 
            key={address.id} 
            className="bg-white rounded-xl p-4 shadow-sm"
            data-testid={`card-address-${address.id}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="w-5 h-5 text-[#1C1C1C] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#1C1C1C]">{address.label}</h3>
                    {address.isDefault && (
                      <span className="text-xs bg-[#1A9952] text-white px-2 py-0.5 rounded">Default</span>
                    )}
                  </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {getFullAddress(address)}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleEdit(address)}
                className="text-[#1A9952] font-semibold text-sm"
                data-testid={`button-edit-${address.id}`}
              >
                EDIT
              </button>
              <button
                onClick={() => handleDelete(address)}
                  disabled={deleteAddressMutation.isPending}
                  className="text-[#1A9952] font-semibold text-sm disabled:opacity-50"
                data-testid={`button-delete-${address.id}`}
              >
                  {deleteAddressMutation.isPending ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add New Address Button */}
      <div className="fixed bottom-24 left-4 right-4">
        <Button
          onClick={handleAddNew}
          variant="outline"
          className="w-full border-[#1A9952] text-[#1A9952] bg-white/90 backdrop-blur-sm py-4 rounded-xl font-semibold"
          data-testid="button-add-address"
        >
          ADD NEW ADDRESS
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {modalState === "delete" && selectedAddress && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
          onClick={() => setModalState("none")}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-center text-[#1C1C1C] mb-4">
              Are you sure you want to delete this address?
            </h2>
            
            <div className="border border-gray-200 rounded-lg py-3 px-4 mb-4 text-center">
              <span className="text-[#1C1C1C]">{selectedAddress.name}</span>
            </div>

            <Button
              onClick={confirmDelete}
              disabled={deleteAddressMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold mb-3 disabled:opacity-50"
              data-testid="button-confirm-delete"
            >
              {deleteAddressMutation.isPending ? "DELETING..." : "DELETE"}
            </Button>

            <Button
              onClick={() => setModalState("none")}
              variant="outline"
              className="w-full border-[#1A9952] text-[#1A9952] py-4 rounded-lg font-semibold"
              data-testid="button-cancel-delete"
            >
              CANCEL
            </Button>
          </div>
        </div>
      )}

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
