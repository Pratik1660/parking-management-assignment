
import { useState } from 'react';
import API_BASE_URL from '../../config/api';

const AddParkingArea = ({ onAreaAdded }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    const [bikeTotal, setBikeTotal] = useState('');
    const [carTotal, setCarTotal] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        // Validate required fields
        if (!name.trim() || !address.trim()) {
            setError('Please enter parking area name and address.');
            return;
        }

        if (bikeTotal === '' || carTotal === '') {
            setError('Please enter total slots for both Bike and Car.');
            return;
        }

        const bikeSlots = Number(bikeTotal);
        const carSlots = Number(carTotal);

        if (
            !Number.isInteger(bikeSlots) ||
            !Number.isInteger(carSlots) ||
            bikeSlots < 0 ||
            carSlots < 0
        ) {
            setError('Slot counts must be valid non-negative integers.');
            return;
        }

        const payload = {
            name: name.trim(),
            address: address.trim(),
            capacities: [
                {
                    vehicle_type: 'BIKE',
                    total_slots: bikeSlots
                },
                {
                    vehicle_type: 'CAR',
                    total_slots: carSlots
                }
            ]
        };

        try {
            setLoading(true);

            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/parking-areas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add parking area.');
            }

            setMessage(result.message || 'Parking area added successfully.');

            // Reset form
            setName('');
            setAddress('');
            setBikeTotal('');
            setCarTotal('');

            // Refresh parking area list in parent component
            onAreaAdded?.();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
                Add New Parking Area
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Parking Area Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parking Area Name
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter parking area name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location / Address
                    </label>

                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter parking area address"
                        rows="2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Bike Slots */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                        Bike Parking
                    </h3>

                    <label className="block text-sm text-gray-600 mb-1">
                        Total Bike Slots
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={bikeTotal}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value === '' || /^\d+$/.test(value)) {
                                setBikeTotal(value);
                            }
                        }}
                        placeholder="Enter total bike slots"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Car Slots */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                        Car Parking
                    </h3>

                    <label className="block text-sm text-gray-600 mb-1">
                        Total Car Slots
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={carTotal}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value === '' || /^\d+$/.test(value)) {
                                setCarTotal(value);
                            }
                        }}
                        placeholder="Enter total car slots"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Messages */}
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                {message && (
                    <p className="text-sm text-green-600">{message}</p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Parking Area'}
                </button>

            </form>
        </div>
    );
};

export default AddParkingArea;
