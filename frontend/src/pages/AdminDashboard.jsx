
import { useNavigate } from 'react-router-dom';

import AllParkingAreas from '../components/admin/AllParkingAreas';
import AddParkingArea from '../components/admin/AddParkingArea';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600">
                    Parking management System Admin
                </h1>

                <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                        {user?.name || 'Admin'}
                    </span>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">
                        Admin Dashboard
                    </h2>

                    <p className="text-gray-600 mt-1">
                        Manage parking areas and their slot capacities.
                    </p>
                </div>

                <AllParkingAreas />

                <AddParkingArea />
            </main>
        </div>
    );
};

export default AdminDashboard;
