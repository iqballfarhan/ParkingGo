import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router } from 'react-router-dom';
import client from './graphql/client';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common';
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="min-h-screen bg-gray-100">
            <AppRoutes />
            <Toaster position="top-right" />
          </div>
        </Router>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
