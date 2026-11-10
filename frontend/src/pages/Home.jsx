import { useState } from 'react';

import Login from '../components/Login';
import Signup from '../components/Signup';
import CustomerDashboard from './CustomerDashboard';

const Home = () => {
    const [activeForm, setActiveForm] = useState('login');

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600">
                    Parking Management System Assignment
                </h1>

                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveForm('login')}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Login
                    </button>

                    <button
                        onClick={() => setActiveForm('signup')}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Signup
                    </button>
                </div>
            </header>

            {/* Form */}
            <main className="flex justify-center items-center p-8">
                {activeForm === 'login' ? (
                    <Login onSwitch={() => setActiveForm('signup')} 
                    />
                ) : (
                    <Signup onSwitch={() => setActiveForm('login')} />
                )}
            </main>

        </div>
    );
};

export default Home;