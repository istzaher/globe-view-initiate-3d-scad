
import MapViewer from '@/components/MapViewer';

const Index = () => {
  return (
    <div className="h-[calc(100vh-4rem)]"> {/* Subtract header height */}
      <MapViewer />
    </div>
  );
};

export default Index;
