
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BookParkingSlot from '../components/BookParkingSlot';
import MySlots from '../components/MySlots';

const CustomerDashboard = () => {

    const [activeTab, setActiveTab] = useState('BOOK_SLOT');

    // Refresh My Slots after a successful booking.
    const [bookingRefreshKey, setBookingRefreshKey] = useState(0);

    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        navigate('/', { replace: true });
    };

    const handleBookingSuccess = () => {

        setBookingRefreshKey(previous => previous + 1);
    };

    return (

        <div className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="bg-white shadow-sm">

                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

                    <h1 className="text-2xl font-bold text-blue-600">
                        Parking management System
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        Logout
                    </button>

                </div>

            </header>

            <main className="max-w-6xl mx-auto p-6">

                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    Customer Dashboard
                </h2>

                {/* Navigation */}
                <div className="flex gap-4 mb-6 border-b">

                    <button
                        onClick={() => setActiveTab('BOOK_SLOT')}
                        className={`px-5 py-3 font-medium ${
                            activeTab === 'BOOK_SLOT'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                        }`}
                    >
                        Book Parking Slot
                    </button>

                    <button
                        onClick={() => setActiveTab('MY_SLOTS')}
                        className={`px-5 py-3 font-medium ${
                            activeTab === 'MY_SLOTS'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                        }`}
                    >
                        My Slots
                    </button>

                </div>

                {/* Component Rendering */}
                {activeTab === 'BOOK_SLOT' && (

                    <BookParkingSlot
                        onBookingSuccess={handleBookingSuccess}
                    />

                )}

                {activeTab === 'MY_SLOTS' && (

                    <MySlots
                        refreshKey={bookingRefreshKey}
                    />

                )}

            </main>

        </div>

    );
};

export default CustomerDashboard;
