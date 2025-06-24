import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

// API URL - sesuaikan dengan URL backend GraphQL Anda
const API_URL = "https://vrjj8bb9-3000.asse.devtunnels.ms/graphql";

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: API_URL,
});

// Authentication link
const authLink = setContext(async (_, { headers }) => {
  try {
    // get the authentication token from secure storage
    const token = await SecureStore.getItemAsync("access_token");
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  } catch (e) {
    console.error("Error setting auth header:", e);
    return {
      headers,
    };
  }
});

// Initialize Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

export default client;
