import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Edit, Trash2 } from "lucide-react";

interface Address {
  id: string;
  label: string;
  address: string;
  landmark?: string;
}

interface AddressCardProps {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export default function AddressCard({ addresses, selectedId, onSelect, onEdit, onDelete, onAddNew }: AddressCardProps) {
  return (
    <Card className="p-4" data-testid="card-addresses">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg" data-testid="text-delivery-address">Delivery Address</h3>
        <Button variant="ghost" size="sm" onClick={onAddNew} data-testid="button-add-address">
          + Add New
        </Button>
      </div>

      <RadioGroup value={selectedId} onValueChange={onSelect}>
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-start gap-3 p-3 rounded-lg border hover-elevate" data-testid={`address-${addr.id}`}>
              <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
              <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" data-testid="text-address-label">{addr.label}</p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-address-details">{addr.address}</p>
                    {addr.landmark && (
                      <p className="text-xs text-muted-foreground mt-1" data-testid="text-address-landmark">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                  </div>
                </div>
              </Label>
              <div className="flex gap-1 flex-shrink-0">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => onEdit(addr.id)}
                  data-testid={`button-edit-${addr.id}`}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(addr.id)}
                  data-testid={`button-delete-${addr.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    </Card>
  );
}
