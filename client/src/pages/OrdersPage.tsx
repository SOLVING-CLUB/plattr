import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, Clock, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/lib/supabase-service";
import FloatingNav from "@/pages/FloatingNav";

import sunburstBg from "@assets/image 1684_1764063713649.png";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  dishId: string;
  dishName: string;
  dishImageUrl: string;
  dishDietaryType: string;
}

interface Order {
  id: string;
  orderNumber: number;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  total: string;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  createdAt: string;
  addressLabel: string;
  address: string;
  items: OrderItem[];
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => orderService.getAll(),
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Format order number
  const formatOrderNumber = (orderNumber: number) => {
    return `#${String(orderNumber).padStart(4, "0")}`;
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "outline"; icon: typeof Check | typeof Clock }> = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      confirmed: { label: "Confirmed", variant: "default", icon: Clock },
      preparing: { label: "Preparing", variant: "default", icon: Clock },
      delivering: { label: "Out for Delivery", variant: "default", icon: Clock },
      delivered: { label: "Delivered", variant: "outline", icon: Check },
      cancelled: { label: "Cancelled", variant: "destructive", icon: Clock },
    };
    return statusMap[status] || { label: status, variant: "default", icon: Clock };
  };

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const isExpanded = (orderId: string) => expandedOrders.has(orderId);

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Sunburst Background - Full page with tall image */}
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
          className="text-3xl font-bold text-[#1C1C1C]"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="text-page-title"
        >
          Your Orders
        </h1>
        <p className="text-gray-600 mt-1" data-testid="text-page-subtitle">
          Track and reorder from your past orders
        </p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="px-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-t-2xl pt-5 px-5 pb-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
              <div className="h-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No orders found. Start ordering to see your order history!</p>
        </div>
      ) : (
      <div className="px-4 space-y-4">
          {orders.map((order) => {
            const statusDisplay = getStatusDisplay(order.status);
            const StatusIcon = statusDisplay.icon;
            return (
          <div key={order.id} className="relative" data-testid={`card-order-${order.id}`}>
            {/* Order Card */}
            <div className="bg-white rounded-t-2xl pt-5 px-5 pb-4">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <span 
                  className="text-xl font-bold text-[#1C1C1C]"
                  data-testid={`text-order-number-${order.id}`}
                >
                      {formatOrderNumber(order.orderNumber)}
                </span>
                  <Badge 
                      variant={statusDisplay.variant}
                      className={`${
                        statusDisplay.variant === "outline" 
                          ? "border-[#1A9952] text-[#1A9952]" 
                          : statusDisplay.variant === "destructive"
                          ? "bg-red-500 text-white"
                          : "bg-[#1A9952] text-white"
                      } px-3 py-1 rounded-full flex items-center gap-1`}
                    data-testid={`badge-status-${order.id}`}
                  >
                      <StatusIcon className="w-3 h-3" />
                      {statusDisplay.label}
                  </Badge>
              </div>

              {/* Order Info */}
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <span className="font-semibold text-[#1C1C1C]" data-testid={`text-order-address-${order.id}`}>
                      {order.addressLabel}
                </span>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Calendar className="w-4 h-4" />
                      <span>{formatDate(order.deliveryDate)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                      <span>{order.deliveryTime}</span>
                </div>
              </div>

              {/* View Details Toggle */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="flex items-center gap-1 text-[#1C1C1C] underline mb-4"
                data-testid={`button-toggle-details-${order.id}`}
              >
                <span className="text-sm font-medium">
                  {isExpanded(order.id) ? "Collapse Details" : "View Details"}
                </span>
                <div className="w-5 h-5 bg-[#1C1C1C] rounded-full flex items-center justify-center">
                  {isExpanded(order.id) ? (
                    <ChevronUp className="w-3 h-3 text-white" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded(order.id) && (
                <div className="mb-4 space-y-4" data-testid={`details-${order.id}`}>
                      <div>
                        <h4 className="font-semibold text-[#1C1C1C] mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                  item.dishDietaryType === "veg" ? "border-green-600" : "border-red-600"
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    item.dishDietaryType === "veg" ? "bg-green-600" : "bg-red-600"
                                  }`} />
                                </div>
                                <span className="text-gray-800">{item.dishName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">x{item.quantity}</span>
                                <span className="font-semibold text-[#1C1C1C]">₹{parseFloat(item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-[#1C1C1C]">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span className="text-[#1C1C1C]">₹{parseFloat(order.deliveryFee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Tax</span>
                          <span className="text-[#1C1C1C]">₹{parseFloat(order.tax).toFixed(2)}</span>
                        </div>
                      </div>
                </div>
              )}

              {/* Grand Total and Re-order */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-sm text-gray-500">Grand Total</span>
                  <p 
                    className="text-2xl font-bold text-[#1C1C1C]"
                    data-testid={`text-order-total-${order.id}`}
                  >
                        ₹{parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
                <Button
                      onClick={() => setLocation(`/orders/${order.id}`)}
                  className="bg-[#1C1C1C] hover:bg-[#333] text-white rounded-full px-4"
                      data-testid={`button-view-order-${order.id}`}
                >
                      View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Scalloped Edge at Bottom - Semi-circles cut into card */}
            <svg
              className="w-full -mt-px"
              viewBox="0 0 400 12"
              preserveAspectRatio="none"
              style={{ height: "12px", display: "block" }}
            >
              <path
                d="M0,0 
                   L0,12 
                   Q10,0 20,12 
                   Q30,0 40,12 
                   Q50,0 60,12 
                   Q70,0 80,12 
                   Q90,0 100,12 
                   Q110,0 120,12 
                   Q130,0 140,12 
                   Q150,0 160,12 
                   Q170,0 180,12 
                   Q190,0 200,12 
                   Q210,0 220,12 
                   Q230,0 240,12 
                   Q250,0 260,12 
                   Q270,0 280,12 
                   Q290,0 300,12 
                   Q310,0 320,12 
                   Q330,0 340,12 
                   Q350,0 360,12 
                   Q370,0 380,12 
                   Q390,0 400,12 
                   L400,0 Z"
                fill="white"
              />
            </svg>
          </div>
            );
          })}
      </div>
      )}

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
