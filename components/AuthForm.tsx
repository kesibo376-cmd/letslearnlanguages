import React, { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthForm: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
    }

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
        let friendlyMessage = "An unknown error occurred.";
        if (err.code) {
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    friendlyMessage = 'Invalid email or password.';
                    break;
                case 'auth/email-already-in-use':
                    friendlyMessage = 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'Please enter a valid email address.';
                    break;
                default:
                    friendlyMessage = 'Authentication failed. Please try again.';
            }
        }
        setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 animate-fade-in">
      <div className="w-full max-w-sm mx-auto bg-brand-surface p-8 rounded-lg shadow-2xl b-border b-shadow">
        <h1 className="text-2xl font-bold text-center text-brand-text mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-center text-brand-text-secondary mb-6">Enter your credentials to continue.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-brand-surface-light rounded-md b-border text-brand-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            {/* Fix: Replaced 'class' with 'className' for JSX compatibility. */}
            <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">
                Password
            </label>
            <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLoginMode ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-brand-surface-light rounded-md b-border text-brand-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center animate-shake">{error}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 b-border b-shadow b-shadow-hover rounded-md text-brand-text-on-primary bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                isLoginMode ? 'Login' : 'Sign Up'
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-brand-text-secondary">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
            className="font-medium text-brand-primary hover:text-brand-primary-hover"
          >
            {isLoginMode ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;