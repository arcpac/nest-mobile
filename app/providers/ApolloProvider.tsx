import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ApolloProvider } from "@apollo/client/react";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthProvider";

const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3000";

const GRAPHQL_URL = `${API_BASE}/api/graphql`;

export function AppApolloProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const client = useMemo(() => {
    const httpLink = new HttpLink({ uri: GRAPHQL_URL });

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }, [token]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
