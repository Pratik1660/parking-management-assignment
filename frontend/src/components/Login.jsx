
import { useForm } from 'react-hook-form';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';

const Login = ({ onSwitch}) => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        try {
            // 1. Call Login API
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: data.email.trim(),
                    password: data.password
                })
            });

            const result = await response.json();

            // 2. Check API response status
            if (!response.ok) {
                throw new Error(result.message);
            }

            // 3. Get JWT token and user details
            const { token, user } = result.data;

            // 4. Store JWT and user details
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/customer/dashboard');
            }

            console.log('Logged-in User:', user);

        } catch (error) {
            console.error('Login Error:', error);
            alert(error.message || 'Something went wrong');
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">
                Customer Login
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>

                {/* Email */}
                <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        {...register('email', {
                            required: 'Email is required'
                        })}
                        className="w-full border p-3 rounded-lg"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block mb-2">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        {...register('password', {
                            required: 'Password is required'
                        })}
                        className="w-full border p-3 rounded-lg"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                    Login
                </button>
            </form>

            <p className="text-center mt-5">
                Don't have an account?
                <button
                    type="button"
                    onClick={onSwitch}
                    className="text-blue-600 ml-1 font-semibold"
                >
                    Sign Up
                </button>
            </p>
        </div>
    );
};

export default Login;
