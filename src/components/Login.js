import React, {useCallback, useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import Loader from './Loader';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const {login, register} = useAuth();

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError('');

        try {
            const success = isLogin
                ? await login(username, password, rememberMe)
                : await register(username, password);

            if (!success) {
                setError(isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
        } finally {
            setAuthLoading(false);
        }
    }, [isLogin, username, password, rememberMe, login, register]);

    return (
        <div className="login-container">
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            {error && <div className="error">{error}</div>}
            {authLoading && <Loader/>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    aria-label="Username field"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <div className="rememberMe">
                    <label htmlFor="rememberMe">Se souvenir de moi</label>
                    <input
                        type="checkbox"
                        name="rememberMe"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                    />
                </div>
                <button type="submit" disabled={authLoading}>
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>
            <button className="button-register" onClick={() => setIsLogin(!isLogin)} disabled={authLoading}>
                {isLogin ? 'Need to register?' : 'Already have an account?'}
            </button>
        </div>
    );
}
