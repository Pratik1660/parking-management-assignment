import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import CustomerDashboard from './pages/CustomerDashboard';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/customer/dashboard" element={<CustomerDashboard />} />

                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
};

export default App;