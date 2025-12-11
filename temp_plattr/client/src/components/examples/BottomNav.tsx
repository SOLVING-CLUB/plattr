import BottomNav from '../BottomNav';
import { useState } from 'react';

export default function BottomNavExample() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-[200px] relative pb-16">
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Active tab: <span className="font-semibold text-foreground">{activeTab}</span></p>
      </div>
      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={3}
      />
    </div>
  );
}
