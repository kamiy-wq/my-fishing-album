
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

const FishIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.726 5.894c-2.206 0-4.102 1.48-4.102 4.102 0 2.623 1.896 4.102 4.102 4.102s4.102-1.48 4.102-4.102c0-2.623-1.896-4.102-4.102-4.102zM19.1 12.197c.219-.876.328-1.752.328-2.623 0-4.102-2.92-7.382-6.726-7.382S5.974 5.472 5.974 9.574c0 .87.11 1.747.328 2.623-2.733.219-4.93 1.48-4.93 2.92 0 1.657 2.622 3 5.862 3 1.48 0 2.812-.438 3.823-1.198M18.88 15.117c1.314 0 2.41.985 2.41 2.192 0 1.206-1.096 2.191-2.41 2.191s-2.41-.985-2.41-2.191c0-1.207 1.096-2.192 2.41-2.192z" />
    </svg>
);

const AuthButton: React.FC = () => {
    const { user, signInWithGoogle, logout, loading } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    if (loading) {
        return <div className="w-10 h-10 bg-blue-500 rounded-full animate-pulse"></div>;
    }
    
    if (user) {
        return (
            <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="rounded-full overflow-hidden border-2 border-blue-400 hover:border-white transition-all">
                    <img src={user.photoURL || undefined} alt="User" className="w-10 h-10" referrerPolicy="no-referrer" />
                </button>
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            {user.displayName}
                        </div>
                        <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            ログアウト
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={signInWithGoogle}
            className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg shadow hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.556,44,29.84,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            <span>ログイン</span>
        </button>
    );
};

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <FishIcon />
            <h1 className="text-2xl font-bold text-white tracking-wide">
            我が家の釣り図鑑
            </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <AuthButton />
        </div>
      </div>
    </header>
  );
};

export default Header;