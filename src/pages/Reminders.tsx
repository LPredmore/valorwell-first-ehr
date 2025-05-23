
import Layout from '../components/layout/Layout';

const Reminders = () => {
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-8 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Reminders Coming Soon</h2>
          <p className="text-gray-600 max-w-md">
            The reminders feature will be implemented in the next phase.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Reminders;
