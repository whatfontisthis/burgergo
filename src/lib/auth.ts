// Simple employee authentication
// Password stored in environment variable for security

const EMPLOYEE_PASSWORD = import.meta.env.VITE_EMPLOYEE_PASSWORD || '';

// Check if user is authenticated
export const isEmployeeAuthenticated = (): boolean => {
  return sessionStorage.getItem('employee_authenticated') === 'true';
};

// Login function
export const employeeLogin = (password: string): boolean => {
  if (!EMPLOYEE_PASSWORD) {
    console.warn('Employee password not configured. Using default.');
    // For development, allow any password if not configured
    if (password === 'admin' || password === EMPLOYEE_PASSWORD) {
      sessionStorage.setItem('employee_authenticated', 'true');
      return true;
    }
    return false;
  }
  
  if (password === EMPLOYEE_PASSWORD) {
    sessionStorage.setItem('employee_authenticated', 'true');
    return true;
  }
  return false;
};

// Logout function
export const employeeLogout = (): void => {
  sessionStorage.removeItem('employee_authenticated');
};
