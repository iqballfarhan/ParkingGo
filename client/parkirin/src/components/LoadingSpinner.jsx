import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Memuat...', size = 40 }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner; 