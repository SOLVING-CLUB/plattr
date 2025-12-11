import FloatingCartButton from '../FloatingCartButton';

export default function FloatingCartButtonExample() {
  return (
    <div className="min-h-[300px] relative bg-muted/30">
      <FloatingCartButton 
        itemCount={3}
        totalPrice={340}
        onClick={() => console.log('Cart clicked')}
      />
    </div>
  );
}
