import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";

import sunburstBg from "@assets/image 1684_1764063713649.png";

interface UpiMethod {
  id: string;
  upiId: string;
}

interface CardMethod {
  id: string;
  cardNumber: string;
  validThrough: string;
  cvv: string;
  nameOnCard: string;
  nickname: string;
  cardType: "mastercard" | "visa";
}

const initialUpiMethods: UpiMethod[] = [
  { id: "1", upiId: "email@okbankname" }
];

const initialCardMethods: CardMethod[] = [
  {
    id: "1",
    cardNumber: "1234567890121515",
    validThrough: "12/25",
    cvv: "123",
    nameOnCard: "Rahul Krishna",
    nickname: "HDFC",
    cardType: "mastercard"
  },
  {
    id: "2",
    cardNumber: "1234567890125678",
    validThrough: "06/26",
    cvv: "456",
    nameOnCard: "Rahul Krishna",
    nickname: "AXIS",
    cardType: "visa"
  }
];

type ModalState = "none" | "delete-upi" | "delete-card" | "add-upi" | "add-card";

export default function PaymentMethods() {
  const [, setLocation] = useLocation();
  const [upiMethods, setUpiMethods] = useState<UpiMethod[]>(initialUpiMethods);
  const [cardMethods, setCardMethods] = useState<CardMethod[]>(initialCardMethods);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedUpi, setSelectedUpi] = useState<UpiMethod | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardMethod | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");

  const [upiForm, setUpiForm] = useState({
    upiId: "",
    saveForFuture: true
  });

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    validThrough: "",
    cvv: "",
    nameOnCard: "",
    nickname: "",
    secureCard: true
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

  const handleDeleteUpi = (upi: UpiMethod) => {
    setSelectedUpi(upi);
    setModalState("delete-upi");
  };

  const handleDeleteCard = (card: CardMethod) => {
    setSelectedCard(card);
    setModalState("delete-card");
  };

  const confirmDeleteUpi = () => {
    if (selectedUpi) {
      setUpiMethods(upiMethods.filter(u => u.id !== selectedUpi.id));
    }
    setModalState("none");
    setSelectedUpi(null);
  };

  const confirmDeleteCard = () => {
    if (selectedCard) {
      setCardMethods(cardMethods.filter(c => c.id !== selectedCard.id));
    }
    setModalState("none");
    setSelectedCard(null);
  };

  const handleAddUpi = () => {
    setUpiForm({ upiId: "", saveForFuture: true });
    setModalState("add-upi");
  };

  const handleAddCard = () => {
    setCardForm({
      cardNumber: "",
      validThrough: "",
      cvv: "",
      nameOnCard: "",
      nickname: "",
      secureCard: true
    });
    setModalState("add-card");
  };

  const handleSaveUpi = () => {
    if (upiForm.upiId.trim()) {
      const newUpi: UpiMethod = {
        id: Date.now().toString(),
        upiId: upiForm.upiId
      };
      setUpiMethods([...upiMethods, newUpi]);
      setModalState("none");
    }
  };

  const handleSaveCard = () => {
    if (cardForm.cardNumber && cardForm.validThrough && cardForm.cvv && cardForm.nameOnCard) {
      const newCard: CardMethod = {
        id: Date.now().toString(),
        cardNumber: cardForm.cardNumber.replace(/\s/g, ""),
        validThrough: cardForm.validThrough,
        cvv: cardForm.cvv,
        nameOnCard: cardForm.nameOnCard,
        nickname: cardForm.nickname,
        cardType: cardForm.cardNumber.startsWith("4") ? "visa" : "mastercard"
      };
      setCardMethods([...cardMethods, newCard]);
      setModalState("none");
    }
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(" ") : numbers;
  };

  const getLastFourDigits = (cardNumber: string) => {
    return cardNumber.slice(-4);
  };

  const isUpiFormValid = upiForm.upiId.trim().length > 0;
  const isCardFormValid = cardForm.cardNumber.length >= 16 && 
    cardForm.validThrough.length >= 4 && 
    cardForm.cvv.length >= 3 && 
    cardForm.nameOnCard.length > 0;

  // Add UPI Form
  if (modalState === "add-upi") {
    return (
      <div className="min-h-screen bg-white relative pb-24">
        <div className="px-5 pt-12 pb-4">
          <button 
            onClick={() => setModalState("none")}
            className="flex items-center gap-1 text-[#1C1C1C] mb-6"
            data-testid="button-back-payment"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back To Payment Method</span>
          </button>

          <h2 className="text-lg font-bold text-[#1C1C1C] mb-3">Enter Your UPI ID</h2>
          
          <Input
            value={upiForm.upiId}
            onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
            placeholder="exampleupi@okbank"
            className={`w-full rounded-lg py-3 px-4 mb-4 ${
              upiForm.upiId ? "border-[#1A9952]" : "border-gray-200"
            }`}
            data-testid="input-upi-id"
          />

          <div className="flex items-center gap-2 mb-6">
            <Checkbox
              id="save-vpa"
              checked={upiForm.saveForFuture}
              onCheckedChange={(checked) => 
                setUpiForm({ ...upiForm, saveForFuture: checked as boolean })
              }
              className="border-[#1A9952] data-[state=checked]:bg-[#1A9952] data-[state=checked]:border-[#1A9952]"
              data-testid="checkbox-save-vpa"
            />
            <label htmlFor="save-vpa" className="text-sm text-[#1C1C1C]">
              Save VPA for future use
            </label>
          </div>

          <Button
            onClick={handleSaveUpi}
            disabled={!isUpiFormValid}
            className={`w-full py-6 rounded-lg font-semibold tracking-wider ${
              isUpiFormValid 
                ? "bg-[#1A9952] hover:bg-[#158442] text-white" 
                : "bg-[#1A9952]/30 text-white cursor-not-allowed"
            }`}
            data-testid="button-verify-pay"
          >
            VERIFY & PAY
          </Button>
        </div>

        <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    );
  }

  // Add Card Form
  if (modalState === "add-card") {
    return (
      <div className="min-h-screen bg-white relative pb-24">
        <div className="px-5 pt-12 pb-4">
          <button 
            onClick={() => setModalState("none")}
            className="flex items-center gap-1 text-[#1C1C1C] mb-6"
            data-testid="button-back-payment"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back To Payment Method</span>
          </button>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Card Number
              </label>
              <Input
                value={formatCardNumber(cardForm.cardNumber)}
                onChange={(e) => setCardForm({ 
                  ...cardForm, 
                  cardNumber: e.target.value.replace(/\s/g, "").slice(0, 16) 
                })}
                placeholder="1245 2345 5672"
                className={`w-full rounded-lg py-3 px-4 ${
                  cardForm.cardNumber ? "border-[#1A9952]" : "border-gray-200"
                }`}
                data-testid="input-card-number"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                  Valid Through
                </label>
                <Input
                  value={cardForm.validThrough}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                    }
                    setCardForm({ ...cardForm, validThrough: value });
                  }}
                  placeholder="12/25"
                  maxLength={5}
                  className={`w-full rounded-lg py-3 px-4 ${
                    cardForm.validThrough ? "border-[#1A9952]" : "border-gray-200"
                  }`}
                  data-testid="input-valid-through"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                  CVV
                </label>
                <Input
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ 
                    ...cardForm, 
                    cvv: e.target.value.replace(/\D/g, "").slice(0, 4) 
                  })}
                  placeholder="546"
                  type="password"
                  maxLength={4}
                  className={`w-full rounded-lg py-3 px-4 ${
                    cardForm.cvv ? "border-[#1A9952]" : "border-gray-200"
                  }`}
                  data-testid="input-cvv"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Name on Card
              </label>
              <Input
                value={cardForm.nameOnCard}
                onChange={(e) => setCardForm({ ...cardForm, nameOnCard: e.target.value })}
                placeholder="Rahul Krishna"
                className={`w-full rounded-lg py-3 px-4 ${
                  cardForm.nameOnCard ? "border-[#1A9952]" : "border-gray-200"
                }`}
                data-testid="input-name-on-card"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Enter Card Nickname
              </label>
              <Input
                value={cardForm.nickname}
                onChange={(e) => setCardForm({ ...cardForm, nickname: e.target.value })}
                placeholder="Card Nickname"
                className={`w-full rounded-lg py-3 px-4 ${
                  cardForm.nickname ? "border-[#1A9952]" : "border-gray-200"
                }`}
                data-testid="input-card-nickname"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="secure-card"
                checked={cardForm.secureCard}
                onCheckedChange={(checked) => 
                  setCardForm({ ...cardForm, secureCard: checked as boolean })
                }
                className="border-[#1A9952] data-[state=checked]:bg-[#1A9952] data-[state=checked]:border-[#1A9952]"
                data-testid="checkbox-secure-card"
              />
              <label htmlFor="secure-card" className="text-sm text-[#1C1C1C]">
                Secure this Card
              </label>
            </div>

            <Button
              onClick={handleSaveCard}
              disabled={!isCardFormValid}
              className={`w-full py-6 rounded-lg font-semibold tracking-wider ${
                isCardFormValid 
                  ? "bg-[#1A9952] hover:bg-[#158442] text-white" 
                  : "bg-[#1A9952]/30 text-white cursor-not-allowed"
              }`}
              data-testid="button-proceed"
            >
              PROCEED
            </Button>
          </div>
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
          className="text-3xl font-bold text-[#1C1C1C]"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="text-page-title"
        >
          Payment Methods
        </h1>
      </div>

      {/* UPI Section */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
          <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Pay by any UPI</h2>
          
          {upiMethods.map((upi) => (
            <div 
              key={upi.id}
              className="flex items-center justify-between py-3 border-b border-gray-100"
              data-testid={`row-upi-${upi.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path fill="#097939" d="M12.5 2L7 10h4v12l5.5-8H13V2z"/>
                    <path fill="#ED752E" d="M11.5 2L6 10h4v12l5.5-8H12V2z" transform="translate(2, 0)"/>
                  </svg>
                </div>
                <span className="text-[#1C1C1C]">{upi.upiId}</span>
              </div>
              <button
                onClick={() => handleDeleteUpi(upi)}
                className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"
                data-testid={`button-delete-upi-${upi.id}`}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ))}
          
          <button
            onClick={handleAddUpi}
            className="flex items-center gap-3 py-3 text-[#1C1C1C]"
            data-testid="button-add-upi"
          >
            <div className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-500" />
            </div>
            <span>Add a New UPI ID</span>
          </button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
          <h2 className="text-lg font-bold text-[#1C1C1C] mb-4">Credit & Debit Cards</h2>
          
          {cardMethods.map((card) => (
            <div 
              key={card.id}
              className="flex items-center justify-between py-3 border-b border-gray-100"
              data-testid={`row-card-${card.id}`}
            >
              <div className="flex items-center gap-3">
                {card.cardType === "mastercard" ? (
                  <div className="w-8 h-6 flex items-center">
                    <div className="w-5 h-5 bg-red-500 rounded-full -mr-2"></div>
                    <div className="w-5 h-5 bg-yellow-400 rounded-full opacity-80"></div>
                  </div>
                ) : (
                  <div className="text-blue-800 font-bold text-sm italic">VISA</div>
                )}
                <span className="text-[#1C1C1C] font-medium">{card.nickname}</span>
                <span className="text-gray-500">{getLastFourDigits(card.cardNumber)}</span>
              </div>
              <button
                onClick={() => handleDeleteCard(card)}
                className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"
                data-testid={`button-delete-card-${card.id}`}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ))}
          
          <button
            onClick={handleAddCard}
            className="flex items-center gap-3 py-3 text-[#1C1C1C]"
            data-testid="button-add-card"
          >
            <div className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-500" />
            </div>
            <span>Add a New Card</span>
          </button>
        </div>
      </div>

      {/* Delete UPI Confirmation Modal */}
      {modalState === "delete-upi" && selectedUpi && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
          onClick={() => setModalState("none")}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-center text-[#1C1C1C] mb-4">
              Are you sure you want to delete this Payment Method?
            </h2>
            
            <div className="border border-gray-200 rounded-lg py-3 px-4 mb-4 flex items-center justify-center gap-3">
              <div className="w-6 h-6">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#097939" d="M12.5 2L7 10h4v12l5.5-8H13V2z"/>
                  <path fill="#ED752E" d="M11.5 2L6 10h4v12l5.5-8H12V2z" transform="translate(2, 0)"/>
                </svg>
              </div>
              <span className="text-[#1C1C1C]">{selectedUpi.upiId}</span>
            </div>

            <Button
              onClick={confirmDeleteUpi}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold mb-3"
              data-testid="button-confirm-delete"
            >
              DELETE
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

      {/* Delete Card Confirmation Modal */}
      {modalState === "delete-card" && selectedCard && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
          onClick={() => setModalState("none")}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-center text-[#1C1C1C] mb-4">
              Are you sure you want to delete this Payment Method?
            </h2>
            
            <div className="border border-gray-200 rounded-lg py-3 px-4 mb-4 flex items-center justify-center gap-3">
              {selectedCard.cardType === "mastercard" ? (
                <div className="w-8 h-6 flex items-center">
                  <div className="w-5 h-5 bg-red-500 rounded-full -mr-2"></div>
                  <div className="w-5 h-5 bg-yellow-400 rounded-full opacity-80"></div>
                </div>
              ) : (
                <div className="text-blue-800 font-bold text-sm italic">VISA</div>
              )}
              <span className="text-[#1C1C1C] font-medium">{selectedCard.nickname}</span>
              <span className="text-gray-500">{getLastFourDigits(selectedCard.cardNumber)}</span>
            </div>

            <Button
              onClick={confirmDeleteCard}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-lg font-semibold mb-3"
              data-testid="button-confirm-delete"
            >
              DELETE
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
