import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';

interface AuthContextType {
    user: firebase.User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
