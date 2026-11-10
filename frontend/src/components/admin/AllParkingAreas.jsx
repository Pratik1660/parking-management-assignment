
import { useEffect, useState } from 'react';
import API_BASE_URL from '../../config/api';

const AllParkingAreas = ({ refreshKey }) => {
    const [parkingAreas, setParkingAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
    });

    // Fetch all parking areas
    const fetchParkingAreas = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/parking-areas`, {
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            if (!Array.isArray(result.data.parkingAreas)) {
                throw new Error('Invalid parking areas response.');
            }

            setParkingAreas(result.data.parkingAreas);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParkingAreas();
    }, [refreshKey]);

    // Convert only the actual API values 0 and 1
    const getActiveStatus = (value) => {
        if (value === 1 || value === '1') return true;
        if (value === 0 || value === '0') return false;

        throw new Error(`Invalid is_active value received: ${value}`);
    };

    // Start editing
    const handleEdit = (area) => {
        setMessage('');
        setError('');

        const capacities = {};

        area.capacities.forEach((capacity) => {
            capacities[capacity.vehicle_type] = {
                vehicle_type: capacity.vehicle_type,
                total_slots: String(capacity.total_slots),
                available_slots: String(capacity.available_slots),
                sold_slots: capacity.sold_slots
            };
        });

        setEditingArea({
            id: area.id,
            name: area.name,
            address: area.address,
            capacities
        });
    };

    // Update area name and address
    const handleChange = (field, value) => {
        setEditingArea((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    // Update capacity fields
    const handleCapacityChange = (vehicleType, field, value) => {
    if (value !== '' && !/^\d+$/.test(value)) {
        return;
    }

    const capacity = editingArea.capacities[vehicleType];

    if (field === 'total_slots') {
        if (value !== '' && Number(value) < Number(capacity.sold_slots)) {
            return;
        }

        if (
            value !== '' &&
            capacity.available_slots !== '' &&
            Number(value) < Number(capacity.available_slots)
        ) {
            return;
        }
    }

    if (field === 'available_slots') {
        if (value !== '' && Number(value) < Number(capacity.sold_slots)) {
            return;
        }

        if (
            value !== '' &&
            Number(value) > Number(capacity.total_slots)
        ) {
            return;
        }
    }

    setEditingArea((previous) => ({
        ...previous,
        capacities: {
            ...previous.capacities,
            [vehicleType]: {
                ...previous.capacities[vehicleType],
                [field]: value
            }
        }
    }));
};

    // Update parking area
    const handleUpdate = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        if (!editingArea.name.trim() || !editingArea.address.trim()) {
            setError('Name and address are required.');
            return;
        }

        const capacities = Object.values(editingArea.capacities).map((capacity) => ({
            vehicle_type: capacity.vehicle_type,
            total_slots: Number(capacity.total_slots),
            available_slots: Number(capacity.available_slots)
        }));

        for (const capacity of capacities) {
            const current = editingArea.capacities[capacity.vehicle_type];

            if (
                current.total_slots === '' ||
                current.available_slots === '' ||
                !Number.isInteger(capacity.total_slots) ||
                !Number.isInteger(capacity.available_slots) ||
                capacity.total_slots < 0 ||
                capacity.available_slots < Number(current.sold_slots) ||
                capacity.available_slots > capacity.total_slots
            ) {
                setError(
                    `${capacity.vehicle_type}: Available slots must be between Sold slots and Total slots.`
                );
                return;
            }
        }

        try {
            setSaving(true);

            const response = await fetch(
                `${API_BASE_URL}/parking-areas/${editingArea.id}`,
                {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        name: editingArea.name.trim(),
                        address: editingArea.address.trim(),
                        capacities
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            setEditingArea(null);
            setMessage(result.message);

            await fetchParkingAreas();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="text-gray-600">Loading parking areas...</p>;
    }

    return (
        <section className="bg-white rounded-xl shadow p-6">

            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                    All Parking Areas
                </h2>

                <button
                    type="button"
                    onClick={fetchParkingAreas}
                    className="text-blue-600 hover:underline"
                >
                    Refresh
                </button>
            </div>

            {message && (
                <p className="mb-4 text-green-700 bg-green-50 p-3 rounded">
                    {message}
                </p>
            )}

            {error && (
                <p className="mb-4 text-red-700 bg-red-50 p-3 rounded">
                    {error}
                </p>
            )}

            {parkingAreas.length === 0 ? (
                <p className="text-gray-500">No parking areas found.</p>
            ) : (
                <div className="space-y-5">

                    {parkingAreas.map((area) => {
                        const isActive = getActiveStatus(area.is_active);

                        return (
                            <div
                                key={area.id}
                                className="border rounded-lg p-4"
                            >
                                <div className="flex justify-between items-start gap-4 mb-4">

                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {area.name}
                                        </h3>

                                        <p className="text-sm text-gray-600">
                                            {area.address}
                                        </p>

                                        <span
                                            className={`text-xs font-medium ${
                                                isActive
                                                    ? 'text-green-700'
                                                    : 'text-red-700'
                                            }`}
                                        >
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleEdit(area)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {area.capacities.map((capacity) => (
                                        <div
                                            key={capacity.capacity_id}
                                            className="bg-gray-50 rounded-lg p-4"
                                        >
                                            <h4 className="font-semibold mb-3">
                                                {capacity.vehicle_type}
                                            </h4>

                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <p>
                                                    Total: <strong>{capacity.total_slots}</strong>
                                                </p>

                                                <p>
                                                    Available: <strong>{capacity.available_slots}</strong>
                                                </p>

                                                <p>
                                                    Sold: <strong>{capacity.sold_slots}</strong>
                                                </p>

                                                <p>
                                                    Bookable: <strong>
                                                        {Number(capacity.available_slots) -
                                                            Number(capacity.sold_slots)}
                                                    </strong>
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>
                        );
                    })}

                </div>
            )}

            {/* Edit Parking Area */}
            {editingArea && (
                <div className="mt-8 border-t pt-6">

                    <h3 className="text-lg font-bold mb-4">
                        Edit Parking Area
                    </h3>

                    <form onSubmit={handleUpdate} className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Parking Area Name
                            </label>

                            <input
                                type="text"
                                value={editingArea.name}
                                onChange={(e) =>
                                    handleChange('name', e.target.value)
                                }
                                required
                                className="w-full border rounded-lg p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Address / Location
                            </label>

                            <textarea
                                value={editingArea.address}
                                onChange={(e) =>
                                    handleChange('address', e.target.value)
                                }
                                required
                                className="w-full border rounded-lg p-2"
                            />
                        </div>

                        {Object.entries(editingArea.capacities).map(([type, capacity]) => (
                            <div key={type} className="border rounded-lg p-4">

                                <h4 className="font-semibold mb-3">
                                    {type} Capacity
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                    <div>
                                        <label className="block text-sm mb-1">
                                            Total Slots
                                        </label>

                                        <input
                                            type="number"
                                            min={capacity.sold_slots}
                                            step="1"
                                            value={capacity.total_slots}
                                            onChange={(e) =>
                                                handleCapacityChange(
                                                    type,
                                                    'total_slots',
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="w-full border rounded p-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">
                                            Available Slots
                                        </label>

                                        <input
                                            type="number"
                                            min={capacity.sold_slots}
                                            max={capacity.total_slots}
                                            step="1"
                                            value={capacity.available_slots}
                                            onChange={(e) =>
                                                handleCapacityChange(
                                                    type,
                                                    'available_slots',
                                                    e.target.value
                                                )
                                            }
                                            required
                                            className="w-full border rounded p-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">
                                            Sold Slots (Read-only)
                                        </label>

                                        <input
                                            type="number"
                                            value={capacity.sold_slots}
                                            readOnly
                                            className="w-full border rounded p-2 bg-gray-100"
                                        />
                                    </div>

                                </div>
                            </div>
                        ))}

                        <div className="flex gap-3">

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setEditingArea(null)}
                                className="border px-5 py-2 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>

                        </div>
                    </form>
                </div>
            )}

        </section>
    );
};

export default AllParkingAreas;
