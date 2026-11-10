
import { useForm } from 'react-hook-form';
import API_BASE_URL from '../config/api'

const Signup = ({ onSwitch }) => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        try {
            console.log('Signup Data:', data);
            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: data.name.trim(),
                        email: data.email.trim(),
                        password: data.password,
                        phone: data.phone?.trim() || null
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Registration failed'
                );
            }

            alert(result.message || 'Registration successful!');

            // Switch to Login after successful registration
            onSwitch();

        } catch (error) {
            console.error('Signup Error:', error);
            alert(error.message || 'Something went wrong');
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">
                Customer Signup
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>

                {/* Name */}
                <div className="mb-4">
                    <label className="block mb-2">Full Name</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        {...register('name', {
                            required: 'Name is required'
                        })}
                        className="w-full border p-3 rounded-lg"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm">
                            {errors.name.message}
                        </p>
                    )}
                </div>

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

                {/* Phone */}
                <div className="mb-4">
                    <label className="block mb-2">Phone</label>
                    <input
                        type="tel"
                        placeholder="Enter your phone number"
                        {...register('phone')}
                        className="w-full border p-3 rounded-lg"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block mb-2">Password</label>
                    <input
                        type="password"
                        placeholder="Create a password"
                        {...register('password', {
                            required: 'Password is required',
                            minLength: {
                                value: 6,
                                message: 'Minimum 6 characters required'
                            }
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
                    Sign Up
                </button>
            </form>

            <p className="text-center mt-5">
                Already have an account?
                <button
                    type="button"
                    onClick={onSwitch}
                    className="text-blue-600 ml-1 font-semibold"
                >
                    Login
                </button>
            </p>
        </div>
    );
};

export default Signup;
