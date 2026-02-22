import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const LS_TOKEN = "fl_token";
const LS_USER = "fl_user";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem(LS_USER);
        return raw ? JSON.parse(raw) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) || "");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // if token exists, try to refresh / validate session
        const run = async () => {
            try {
                if (!token) return;
                const me = await authService.me();
                setUser(me);
                localStorage.setItem(LS_USER, JSON.stringify(me));
            } catch {
                // invalid token
                setUser(null);
                setToken("");
                localStorage.removeItem(LS_TOKEN);
                localStorage.removeItem(LS_USER);
            } finally {
                setIsLoading(false);
            }
        };
        run();
        if (!token) setIsLoading(false);
    }, [token]);

    const login = async ({ email, password }) => {
        const res = await authService.login({ email, password });
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem(LS_TOKEN, res.token);
        localStorage.setItem(LS_USER, JSON.stringify(res.user));
        return res;
    };

    const register = async ({ name, email, password, role }) => {
        const res = await authService.register({ name, email, password, role });
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem(LS_TOKEN, res.token);
        localStorage.setItem(LS_USER, JSON.stringify(res.user));
        return res;
    };

    const logout = () => {
        setUser(null);
        setToken("");
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_USER);
    };

    const value = useMemo(
        () => ({ user, token, isLoading, login, register, logout }),
        [user, token, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

// helper for api client
export function getAuthToken() {
    return localStorage.getItem(LS_TOKEN) || "";
}
