// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/login' : '/create-account';
        const payload = isLogin 
            ? { email: formData.email, password: formData.password }
            : formData;

        try {
            const response = await axiosClient.post(endpoint, payload);
            
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Verify credentials and retry.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sans text-slate-900">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100/60 overflow-hidden transition-all">
                <div className="px-10 py-12">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white mb-6 shadow-md">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                            {isLogin ? 'Portal Access' : 'Candidate Provisioning'}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">
                            {isLogin ? 'Authenticate to interface with the evaluation environment.' : 'Register parameters to generate a candidate profile.'}
                        </p>
                    </div>
                    
                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center">
                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Legal Designation</label>
                                <input 
                                    type="text" 
                                    name="fullName" 
                                    value={formData.fullName} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400 font-medium" 
                                    placeholder="John Doe" 
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Corporate Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400 font-medium" 
                                placeholder="name@enterprise.com" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Authorization Key</label>
                            <input 
                                type="password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400 font-medium tracking-widest" 
                                placeholder="••••••••" 
                            />
                        </div>
                        
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className={`w-full py-4 px-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-sm transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-md'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Executing...
                                    </span>
                                ) : (isLogin ? 'Initiate Session' : 'Execute Provisioning')}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-500">
                        {isLogin ? "Require system access? " : "Credentials already provisioned? "}
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                            className="font-bold text-slate-900 hover:text-slate-700 transition-colors"
                        >
                            {isLogin ? 'Request Profile' : 'Authenticate Here'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}