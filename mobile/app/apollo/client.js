import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";

// Create an HTTP link with optimized settings
const httpLink = new HttpLink({
  uri: "https://vrjj8bb9-3000.asse.devtunnels.ms/graphql",
  // Add caching and timeout optimizations
  fetchOptions: {
    timeout: 5000, // 5 second timeout for faster fails
  },
});

// Create a WebSocket link
const wsLink = new WebSocketLink({
  uri: `ws://vrjj8bb9-3000.asse.devtunnels.ms/graphql`, // Pastikan ini menggunakan ws:// atau wss://
  options: {
    reconnect: true,
    connectionParams: {
      // Authentication headers if needed
      // authToken: localStorage.getItem('token'),
    },
  },
});

// Split link berdasarkan operasi type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

// Create Apollo Client with optimized cache settings
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    // Optimize cache for frequent updates
    typePolicies: {
      Query: {
        fields: {
          getRoomMessages: {
            // Always fetch fresh data for messages
            fetchPolicy: "cache-and-network",
          },
        },
      },
    },
  }),
  // Enable network-only for development/testing
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
  },
});

export default client;
