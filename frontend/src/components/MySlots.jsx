
import { useEffect, useState } from 'react';

import API_BASE_URL from '../config/api';

const MySlots = ({ refreshKey }) => {

    const [bookings, setBookings] = useState([]);

    const [activeTab, setActiveTab] = useState('ACTIVE');

    const [loading, setLoading] = useState(true);

    const [exitingBookingId, setExitingBookingId] = useState(null);

    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');

    // Fetch customer's bookings.
    const fetchMyBookings = async () => {

        try {

            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/bookings/my`, {

                headers: {
                    Authorization: `Bearer ${token}`
                }

            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to fetch bookings');
            }

            if (!Array.isArray(result.data)) {
                throw new Error('Invalid bookings response received');
            }

setBookings(result.data);

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);

        }
    };

    // Fetch on component load and after a successful booking.
    useEffect(() => {

        fetchMyBookings();

    }, [refreshKey]);

    // Exit active booking.
    const handleExit = async (bookingId) => {

        const shouldExit = window.confirm(
            'Are you sure you want to exit this parking slot?'
        );

        if (!shouldExit) {
            return;
        }

        try {

            setExitingBookingId(bookingId);

            setError('');
            setSuccess('');

            const response = await fetch(
                `${API_BASE_URL}/bookings/${bookingId}/exit`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to exit parking slot');
            }

            setSuccess(result.message || 'Parking slot exited successfully');

            // Fetch updated booking history.
            await fetchMyBookings();

        } catch (error) {

            setError(error.message);

        } finally {

            setExitingBookingId(null);

        }
    };

    const filteredBookings = bookings.filter(booking => {

        return booking.status === activeTab;

    });

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return '-';
        }

        return new Date(dateValue).toLocaleString('en-IN');

    };

    return (

        <div className="bg-white rounded-xl shadow-sm p-6">

            <div className="flex justify-between items-center mb-6">

                <h3 className="text-2xl font-semibold text-gray-800">
                    My Slots
                </h3>

                <button
                    onClick={fetchMyBookings}
                    disabled={loading}
                    className="text-blue-600 font-medium hover:text-blue-800 disabled:text-gray-400"
                >
                    Refresh
                </button>

            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b mb-6">

                <button
                    onClick={() => setActiveTab('ACTIVE')}
                    className={`px-4 py-3 font-medium ${
                        activeTab === 'ACTIVE'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500'
                    }`}
                >
                    Active Slots
                </button>

                <button
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-4 py-3 font-medium ${
                        activeTab === 'COMPLETED'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500'
                    }`}
                >
                    Past Slots
                </button>

            </div>

            {/* Error */}
            {error && (

                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 mb-4">
                    {error}
                </div>

            )}

            {/* Success */}
            {success && (

                <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 mb-4">
                    {success}
                </div>

            )}

            {loading ? (

                <p className="text-gray-600 py-6 text-center">
                    Loading bookings...
                </p>

            ) : filteredBookings.length === 0 ? (

                <div className="text-center py-10">

                    <p className="text-gray-500">
                        {activeTab === 'ACTIVE'
                            ? 'You do not have any active parking slots.'
                            : 'You do not have any past bookings.'}
                    </p>

                </div>

            ) : (

                <div className="space-y-4">

                    {filteredBookings.map(booking => (

                        <div
                            key={booking.booking_id}
                            className="border border-gray-200 rounded-lg p-5"
                        >

                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">

                                <div className="space-y-2">

                                    <h4 className="text-lg font-semibold text-gray-800">
                                        {booking.parking_area_name}
                                    </h4>

                                    <p className="text-sm text-gray-500">
                                        {booking.parking_area_address}
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            Vehicle Type:
                                        </span>{' '}
                                        {booking.vehicle_type}
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            Vehicle Number:
                                        </span>{' '}
                                        {booking.vehicle_number}
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            Entry Time:
                                        </span>{' '}
                                        {formatDate(booking.entry_time)}
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            Exit Time:
                                        </span>{' '}
                                        {formatDate(booking.exit_time)}
                                    </p>

                                </div>

                                <div className="flex flex-col items-start md:items-end gap-3">

                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            booking.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {booking.status}
                                    </span>

                                    {booking.status === 'ACTIVE' && (

                                        <button
                                            onClick={() => handleExit(booking.booking_id)}
                                            disabled={exitingBookingId === booking.booking_id}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                                        >
                                            {exitingBookingId === booking.booking_id
                                                ? 'Exiting...'
                                                : 'Exit Parking'}
                                        </button>

                                    )}

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>

    );
};

export default MySlots;
