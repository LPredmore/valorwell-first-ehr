
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProvider } from '@/context/UserContext';
import { TimeZoneProvider } from '@/context/TimeZoneContext';
import { ToastProvider } from '@/hooks/use-toast';

// Import mock data initializer early to ensure it runs before components are rendered
import '@/utils/mockDataInitializer';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <UserProvider>
        <TimeZoneProvider>
          <App />
        </TimeZoneProvider>
      </UserProvider>
    </ToastProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
