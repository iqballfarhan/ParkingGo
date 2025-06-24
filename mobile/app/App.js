import { NavigationContainer } from "@react-navigation/native";
import { ApolloProvider } from "@apollo/client";

import AppNavigator from "./navigation/AppNavigator";
import client from "./config/apollo";
import AuthProvider from "./context/authContext";

export default function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ApolloProvider>
  );
}
