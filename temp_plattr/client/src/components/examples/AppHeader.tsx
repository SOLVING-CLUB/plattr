import AppHeader from '../AppHeader';

export default function AppHeaderExample() {
  return (
    <div>
      <AppHeader 
        cartItemCount={3}
        onCartClick={() => console.log('Cart clicked')}
        onMenuClick={() => console.log('Menu clicked')}
        onSearch={(query) => console.log('Search:', query)}
      />
      <div className="p-8 text-center text-muted-foreground">
        Content below header
      </div>
    </div>
  );
}
