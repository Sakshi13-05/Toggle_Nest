import React, { useState } from 'react';
import { ArrowRight, Loader2, User, Mail, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BASE_URL } from '../api/config';
import './Auth.css';

import reg from "/image/reg.jpg";
import toast, { Toaster } from 'react-hot-toast';
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const registerUser = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
        name,
        email,
        onboardingCompleted: false,
        createdAt: new Date(),
    });
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        recoveryEmail: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        const loadingToast = toast.loading("Creating your nest...");

        try {
            // 1. Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // 2. Update Profile
            await updateProfile(userCredential.user, {
                displayName: formData.name,
            });

            const token = await userCredential.user.getIdToken();

            // 3. Sync with MongoDB & Firestore (Only on successful Auth)
            try {
                // Backend Sync
                await fetch(`${BASE_URL}/api/auth/verify`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                });

                // Firestore Initial Record
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: formData.name,
                    email: formData.email,
                    onboardingCompleted: false,
                    createdAt: new Date(),
                });
            } catch (syncError) {
                console.warn("Backend sync failed, but account was created:", syncError);
            }

            toast.success("Welcome to ToggleNest!", { id: loadingToast });
            navigate("/onboarding");

        } catch (error) {
            console.error("Registration Error:", error.code, error.message);

            let message = "Registration failed. Please try again.";

            if (error.code === 'auth/email-already-in-use') {
                message = "Account already exists. Try signing in!";
                toast.error(message, { id: loadingToast, duration: 4000 });
            } else if (error.code === 'auth/weak-password') {
                message = "Password is too weak. Use at least 6 characters.";
                toast.error(message, { id: loadingToast });
            } else if (error.code === 'auth/invalid-email') {
                message = "Please enter a valid email address.";
                toast.error(message, { id: loadingToast });
            } else {
                toast.error(message, { id: loadingToast });
            }
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="auth-page">
            <Toaster position="top-center" reverseOrder={false} />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="auth-split-card"
            >
                {/* Left Side: Form */}
                <div className="auth-left">
                    <div className="auth-header">
                        <h2>Create your account</h2>
                        <p>Start managing your projects efficiently today.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <User className="auth-icon" size={20} />
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Professional Name"
                                className="auth-input"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <Mail className="auth-icon" size={20} />
                            <input
                                type="email"
                                name="email"
                                placeholder="Professional Email"
                                className="auth-input"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <ShieldCheck className="auth-icon" size={20} />
                            <input
                                type="email"
                                name="recoveryEmail"
                                placeholder="Recovery Email (Optional)"
                                className="auth-input"
                                value={formData.recoveryEmail}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-input-group">
                            <Lock className="auth-icon" size={20} />
                            <input
                                type="password"
                                name="password"
                                placeholder="Create Password"
                                className="auth-input"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-btn-primary"
                            disabled={isLoading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creating Nest...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                        Already have an account? <span style={{ color: '#000000', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Sign in</span>
                    </p>
                </div>

                {/* Right Side: Visual */}
                <div className="auth-right">
                    <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        src={reg}
                        alt="Team Collaboration"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;

