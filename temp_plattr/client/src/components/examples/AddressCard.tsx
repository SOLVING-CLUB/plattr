import AddressCard from '../AddressCard';
import { useState } from 'react';

export default function AddressCardExample() {
  const [selectedId, setSelectedId] = useState('1');
  
  const addresses = [
    {
      id: '1',
      label: 'Home',
      address: '123 MG Road, Koramangala, Bangalore - 560034',
      landmark: 'Near Sigma Mall'
    },
    {
      id: '2',
      label: 'Office',
      address: '45 Whitefield Main Road, ITPL, Bangalore - 560066',
      landmark: 'Opposite Forum Mall'
    }
  ];

  return (
    <div className="p-4 max-w-2xl">
      <AddressCard 
        addresses={addresses}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={(id) => console.log('Edit address', id)}
        onDelete={(id) => console.log('Delete address', id)}
        onAddNew={() => console.log('Add new address')}
      />
    </div>
  );
}
