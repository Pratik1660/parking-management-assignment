
import { useEffect, useState } from 'react';

import API_BASE_URL from '../config/api';

const BookParkingSlot = ({ onBookingSuccess }) => {

    const [parkingAreas, setParkingAreas] = useState([]);

    const [selectedAreaId, setSelectedAreaId] = useState('');

    const [vehicleType, setVehicleType] = useState('BIKE');

    const [vehicleNumber, setVehicleNumber] = useState('');

    const [bookableSlots, setBookableSlots] = useState(null);

    const [loadingAreas, setLoadingAreas] = useState(true);

    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const [booking, setBooking] = useState(false);

    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');

    // Fetch active parking areas.
    const fetchParkingAreas = async () => {

        try {

            setLoadingAreas(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/parking-areas`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to fetch parking areas');
            }

            if (!Array.isArray(result.data?.parkingAreas)) {
                throw new Error('Invalid parking areas response received');
            }

            setParkingAreas(result.data.parkingAreas);

        } catch (error) {

            setError(error.message);

        } finally {

            setLoadingAreas(false);

        }
    };

    // Fetch availability for selected parking area.
    const fetchAvailability = async (areaId) => {

        try {

            setLoadingAvailability(true);
            setBookableSlots(null);
            setError('');

            const response = await fetch(
                `${API_BASE_URL}/parking-areas/${areaId}/availability`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to fetch availability');
            }

            if (!Array.isArray(result.data?.capacities)) {
                throw new Error('Invalid availability response received');
            }

            const selectedCapacity = result.data.capacities.find(
                capacity => capacity.vehicle_type === vehicleType
            );

            if (!selectedCapacity) {
                setBookableSlots(null);
                return;
            }

            const availableSlots = Number(selectedCapacity.available_slots);
            const soldSlots = Number(selectedCapacity.sold_slots);

            if (
                !Number.isInteger(availableSlots) ||
                !Number.isInteger(soldSlots)
            ) {
                throw new Error('Invalid slot count received from server');
            }

            const calculatedBookableSlots = availableSlots - soldSlots;

            if (calculatedBookableSlots < 0) {
                throw new Error('Invalid parking availability received');
            }

            setBookableSlots(calculatedBookableSlots);

        } catch (error) {

            setError(error.message);

        } finally {

            setLoadingAvailability(false);

        }
    };

    // Initial parking areas fetch.
    useEffect(() => {

        fetchParkingAreas();

    }, []);

    // Fetch availability whenever area or vehicle type changes.
    useEffect(() => {

        if (selectedAreaId) {
            fetchAvailability(selectedAreaId);
        } else {
            setBookableSlots(null);
        }

    }, [selectedAreaId, vehicleType]);

    // Handle booking.
    const handleBooking = async (event) => {

        event.preventDefault();

        setError('');
        setSuccess('');

        if (!selectedAreaId) {
            setError('Please select a parking area');
            return;
        }

        if (!vehicleNumber.trim()) {
            setError('Please enter vehicle number');
            return;
        }

        if (bookableSlots === null) {
            setError('Parking availability is not available. Please try again.');
            return;
        }

        if (bookableSlots === 0) {
            setError('No slot available');
            return;
        }

        try {

            setBooking(true);

            const response = await fetch(`${API_BASE_URL}/bookings`, {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({

                    parking_area_id: Number(selectedAreaId),

                    vehicle_type: vehicleType,

                    vehicle_number: vehicleNumber.trim()

                })

            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(result.message || 'Unable to book parking slot');
                return;
            }

            setSuccess(result.message || 'Parking slot booked successfully');

            setVehicleNumber('');

            // Refresh latest availability.
            await fetchAvailability(selectedAreaId);

            // Refresh My Slots when the customer opens it.
            onBookingSuccess?.();

        } catch (error) {

            setError(error.message);

            // Refresh availability after a failed booking too.
            if (selectedAreaId) {
                await fetchAvailability(selectedAreaId);
            }

        } finally {

            setBooking(false);

        }
    };

    return (

        <div className="bg-white rounded-xl shadow-sm p-6">

            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Book Parking Slot
            </h3>

            <form onSubmit={handleBooking} className="space-y-5">

                {/* Parking Area */}
                <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Parking Area
                    </label>

                    <select
                        value={selectedAreaId}
                        onChange={(event) => {
                            setSelectedAreaId(event.target.value);
                            setSuccess('');
                            setError('');
                        }}
                        disabled={loadingAreas}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    >

                        <option value="">
                            {loadingAreas
                                ? 'Loading parking areas...'
                                : 'Select parking area'}
                        </option>

                        {parkingAreas.map(area => (

                            <option
                                key={area.id}
                                value={area.id}
                            >
                                {area.name} - {area.address}
                            </option>

                        ))}

                    </select>

                    {!loadingAreas && parkingAreas.length === 0 && !error && (

                        <p className="text-sm text-gray-500 mt-2">
                            No active parking areas available.
                        </p>

                    )}

                </div>

                {/* Vehicle Type */}
                <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Vehicle Type
                    </label>

                    <select
                        value={vehicleType}
                        onChange={(event) => {
                            setVehicleType(event.target.value);
                            setSuccess('');
                            setError('');
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    >

                        <option value="BIKE">Bike</option>
                        <option value="CAR">Car</option>

                    </select>

                </div>

                {/* Bookable Slots */}
                {selectedAreaId && (

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                        <p className="text-sm text-gray-600">
                            Available bookable slots
                        </p>

                        {loadingAvailability ? (

                            <p className="font-semibold text-gray-600 mt-1">
                                Checking availability...
                            </p>

                        ) : bookableSlots !== null ? (

                            <>

                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                    {bookableSlots}
                                </p>

                                {bookableSlots === 0 && (

                                    <p className="text-red-600 font-medium mt-2">
                                        No slot available
                                    </p>

                                )}

                            </>

                        ) : (

                            <p className="text-gray-600 mt-1">
                                Availability could not be determined.
                            </p>

                        )}

                    </div>

                )}

                {/* Vehicle Number */}
                <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Number
                    </label>

                    <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(event) => {
                            const value = event.target.value;

                            // Allow only alphabets and numbers.
                            if (/^[a-zA-Z0-9]*$/.test(value)) {
                                setVehicleNumber(value.toUpperCase());
                            }
                        }}
                        placeholder="Example: DL01AB1234"
                        maxLength={20}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    />

                </div>

                {/* Error */}
                {error && (

                    <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3">
                        {error}
                    </div>

                )}

                {/* Success */}
                {success && (

                    <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">
                        {success}
                    </div>

                )}

                {/* Book Button */}
                <button
                    type="submit"
                    disabled={
                        booking ||
                        loadingAreas ||
                        loadingAvailability ||
                        !selectedAreaId ||
                        bookableSlots === null ||
                        bookableSlots === 0
                    }
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >

                    {booking
                        ? 'Booking...'
                        : bookableSlots === 0
                            ? 'No Slot Available'
                            : 'Book Parking Slot'}

                </button>

            </form>

        </div>

    );
};

export default BookParkingSlot;
