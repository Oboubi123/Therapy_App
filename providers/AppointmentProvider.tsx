import React, { createContext, useContext, useState } from 'react';

// Define the Consultation type
type Consultation = {
  id: string;
  dateTime: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  clientEmail?: string;
};

export const ConsultationStatus = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
} as const;

const AppointmentContext = createContext<any>(null);

export const AppointmentProvider = ({ children }: { children: React.ReactNode }) => {
  const [appointments, setAppointments] = useState<Consultation[]>([]);

  // Add the missing functions that your component expects
  const getAppointments = async () => {
    // Simulate API call or return stored appointments
    return appointments;
  };

  const updateAppointment = async (id: string, updates: Partial<Consultation>) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === id ? { ...appointment, ...updates } : appointment
      )
    );
    
    // Return the updated appointment
    const updated = appointments.find(a => a.id === id);
    return updated ? { ...updated, ...updates } : updated;
  };

  return (
    <AppointmentContext.Provider value={{ 
      appointments, 
      setAppointments, 
      getAppointments, 
      updateAppointment 
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

// Keep your existing function name but make sure it provides what's needed
export const useAppointment = () => useContext(AppointmentContext);

// Export the Consultation type
export type { Consultation };