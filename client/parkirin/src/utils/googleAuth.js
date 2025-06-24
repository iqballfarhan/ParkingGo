export const initGoogleSignIn = (clientId, onSuccess, onError) => {
  if (!window.google?.accounts?.id) {
    console.error('Google Sign-In SDK not loaded');
    onError('Google Sign-In tidak tersedia');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async (response) => {
      try {
        await onSuccess(response.credential);
      } catch (err) {
        console.error('Google auth error:', err);
        onError(err instanceof Error ? err.message : 'Google login gagal');
      }
    },
  });

  window.google.accounts.id.prompt();
}; 