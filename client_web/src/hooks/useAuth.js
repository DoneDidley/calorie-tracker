import React, { useState, useEffect, useContext, createContext } from "react";

import axios from "axios";

const authContext = createContext();

export function ProvideAuth({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};

function useProvideAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const loggedInUser = await axios.get("/api/auth/user");
      if (loggedInUser) {
        console.log({ loggedInUser });
        setUser(loggedInUser);
      } else {
        setUser(null);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      setUser(res.data.user);
      localStorage.setItem("user", res.data.user);
      return res.data.user;
    } catch (err) {
      throw err;
    }
  };

  const register = (email, password, name) => {};

  const logout = () => {};

  return {
    user,
    login,
    register,
    logout,
  };
}
