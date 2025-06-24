import React from 'react';
import { ApolloError } from '@apollo/client';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const GraphQLErrorBoundary = ({ error, retry, children }) => {
  // If no error, render children normally
  if (!error) {
    return children;
  }

  // Handle different types of Apollo/GraphQL errors
  const renderError = () => {
    if (error instanceof ApolloError) {
      // Network errors
      if (error.networkError) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Connection Error
            </h3>
            <p className="text-red-600 mb-4">
              Unable to connect to the server. Please check your internet connection.
            </p>
            {retry && (
              <button
                onClick={retry}
                className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Retry</span>
              </button>
            )}
          </div>
        );
      }

      // GraphQL errors
      if (error.graphQLErrors?.length > 0) {
        const firstError = error.graphQLErrors[0];
        const code = firstError.extensions?.code;

        switch (code) {
          case 'UNAUTHENTICATED':
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Authentication Required
                </h3>
                <p className="text-yellow-600 mb-4">
                  Please log in to access this feature.
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Login
                </button>
              </div>
            );

          case 'FORBIDDEN':
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Access Denied
                </h3>
                <p className="text-red-600">
                  You don't have permission to access this resource.
                </p>
              </div>
            );

          case 'BAD_USER_INPUT':
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Invalid Input
                </h3>
                <p className="text-orange-600 mb-4">
                  {firstError.message || 'Please check your input and try again.'}
                </p>
                {retry && (
                  <button
                    onClick={retry}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            );

          default:
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">
                  {firstError.message || 'An unexpected error occurred.'}
                </p>
                {retry && (
                  <button
                    onClick={retry}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            );
        }
      }
    }

    // Generic error fallback
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Error
        </h3>
        <p className="text-red-600 mb-4">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {retry && (
          <button
            onClick={retry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };

  return renderError();
};

export default GraphQLErrorBoundary;
