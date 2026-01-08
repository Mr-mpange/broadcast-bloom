import LiveShowManager from './LiveShowManager';

// Test component to verify LiveShowManager works with various data scenarios
const LiveShowManagerTest = () => {
  // Test with normal data
  const normalShows = [
    {
      id: '1',
      name: 'Morning Show',
      description: 'Start your day right',
      genre: 'Talk',
      image_url: 'https://example.com/image1.jpg',
      is_active: true
    },
    {
      id: '2',
      name: 'Evening Jazz',
      description: 'Smooth jazz for your evening',
      genre: 'Jazz',
      image_url: null,
      is_active: true
    }
  ];

  // Test with problematic data (missing properties, null values)
  const problematicShows = [
    {
      id: '3',
      name: 'Test Show',
      // Missing other properties
    },
    null, // Null show
    {
      id: '4',
      name: '', // Empty name
      description: null,
      genre: null,
      image_url: undefined,
      is_active: null
    }
  ] as any;

  // Test with empty array
  const emptyShows: any[] = [];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">LiveShowManager Tests</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Normal Data</h3>
        <LiveShowManager shows={normalShows} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Problematic Data</h3>
        <LiveShowManager shows={problematicShows} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Empty Data</h3>
        <LiveShowManager shows={emptyShows} />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Undefined Props</h3>
        <LiveShowManager shows={undefined as any} />
      </div>
    </div>
  );
};

export default LiveShowManagerTest;