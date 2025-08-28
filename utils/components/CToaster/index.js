import React from 'react';
import { Toaster } from 'react-hot-toast';

const CToaster = () => (
  <>
    <style>
      {`
        @media (max-width: 991px) {
          .toast {
            font-size: 2rem;
            width: 100%;
            max-width: 100%;
          }
        }
      `}
    </style>

    <Toaster
      containerStyle={{ top: '20px', zIndex: 100000000 }}
      toastOptions={{
        className: 'toast',
        duration: 3000,
        success: {
          style: { color: 'green' },
        },
        error: {
          style: { color: 'red' },
        },
      }}
    />
  </>
);

export default CToaster;
