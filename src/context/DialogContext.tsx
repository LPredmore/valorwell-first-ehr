import React, { createContext, useContext, useState, ReactNode, useCallback, useReducer } from 'react';

// Dialog types
export type DialogType =
  | 'appointment'
  | 'availabilitySettings'
  | 'weeklyAvailability'
  | 'singleAvailability'
  | 'diagnostic'
  | 'appointmentDetails'
  | 'editAppointment'
  | 'bookAppointment'
  | 'sessionDidNotOccur'
  | 'documentation'
  | 'viewAvailability'
  | 'appointmentBooking'
  | 'timeOff'
  | 'eventTypeSelector';

// Dialog props interface with stronger typing
export interface DialogProps {
  [key: string]: any;
  selectedDate?: string | null;
  eventId?: string;
  clinicianId?: string;
  clientId?: string;
  appointmentId?: string;
  recurrenceId?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
}

// Dialog state interface
export interface DialogState {
  type: DialogType | null;
  isOpen: boolean;
  props: DialogProps;
  history: Array<{
    type: DialogType;
    props: DialogProps;
  }>;
  stack: Array<{
    type: DialogType;
    props: DialogProps;
  }>;
}

// Initial dialog state
const initialDialogState: DialogState = {
  type: null,
  isOpen: false,
  props: {},
  history: [],
  stack: []
};

// Dialog action types
type DialogAction = 
  | { type: 'OPEN_DIALOG'; payload: { dialogType: DialogType; props?: DialogProps } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'CLOSE_ALL_DIALOGS' }
  | { type: 'PUSH_DIALOG'; payload: { dialogType: DialogType; props?: DialogProps } }
  | { type: 'POP_DIALOG' }
  | { type: 'UPDATE_DIALOG_PROPS'; payload: { props: DialogProps } }
  | { type: 'GO_BACK' };

// Dialog reducer
const dialogReducer = (state: DialogState, action: DialogAction): DialogState => {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return {
        ...state,
        type: action.payload.dialogType,
        isOpen: true,
        props: action.payload.props || {},
        history: [...state.history, { type: action.payload.dialogType, props: action.payload.props || {} }],
        stack: []
      };
    case 'CLOSE_DIALOG':
      return {
        ...state,
        type: null,
        isOpen: false,
        props: {},
        stack: []
      };
    case 'CLOSE_ALL_DIALOGS':
      return {
        ...initialDialogState,
        history: state.history
      };
    case 'PUSH_DIALOG':
      // Only push the current dialog to the stack if there is one
      if (state.type === null) {
        // If no current dialog, just open the new one (same as OPEN_DIALOG)
        return {
          ...state,
          type: action.payload.dialogType,
          isOpen: true,
          props: action.payload.props || {},
          history: [...state.history, { type: action.payload.dialogType, props: action.payload.props || {} }],
          stack: []
        };
      }
      
      return {
        ...state,
        type: action.payload.dialogType,
        isOpen: true,
        props: action.payload.props || {},
        history: [...state.history, { type: action.payload.dialogType, props: action.payload.props || {} }],
        stack: [...state.stack, { type: state.type, props: state.props }]
      };
    case 'POP_DIALOG':
      if (state.stack.length === 0) {
        return {
          ...state,
          type: null,
          isOpen: false,
          props: {}
        };
      }
      const lastDialog = state.stack[state.stack.length - 1];
      return {
        ...state,
        type: lastDialog.type,
        props: lastDialog.props,
        stack: state.stack.slice(0, -1)
      };
    case 'UPDATE_DIALOG_PROPS':
      return {
        ...state,
        props: { ...state.props, ...action.payload.props }
      };
    case 'GO_BACK':
      if (state.history.length <= 1) {
        return {
          ...state,
          type: null,
          isOpen: false,
          props: {},
          stack: []
        };
      }
      const previousDialog = state.history[state.history.length - 2];
      return {
        ...state,
        type: previousDialog.type,
        props: previousDialog.props,
        history: state.history.slice(0, -1),
        stack: []
      };
    default:
      return state;
  }
};

// Dialog context interface
interface DialogContextType {
  state: DialogState;
  openDialog: (dialogType: DialogType, props?: DialogProps) => void;
  closeDialog: () => void;
  closeAllDialogs: () => void;
  pushDialog: (dialogType: DialogType, props?: DialogProps) => void;
  popDialog: () => void;
  updateDialogProps: (props: DialogProps) => void;
  goBack: () => void;
  
  // Legacy support for existing components
  isAppointmentDialogOpen: boolean;
  isAvailabilitySettingsOpen: boolean;
  isWeeklyAvailabilityOpen: boolean;
  isSingleAvailabilityOpen: boolean;
  isDiagnosticOpen: boolean;
  selectedAvailabilityDate: string | null;
  openAppointmentDialog: () => void;
  closeAppointmentDialog: () => void;
  openAvailabilitySettings: () => void;
  closeAvailabilitySettings: () => void;
  openWeeklyAvailability: (date?: string | null) => void;
  closeWeeklyAvailability: () => void;
  openSingleAvailability: () => void;
  closeSingleAvailability: () => void;
  openDiagnosticDialog: () => void;
  closeDiagnosticDialog: () => void;
}

// Create dialog context
const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Dialog provider props
interface DialogProviderProps {
  children: ReactNode;
}

// Dialog provider component
export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dialogReducer, initialDialogState);
  // Remove separate state for selectedAvailabilityDate and use the reducer state instead

  // Dialog actions
  // Helper function to validate dialog props
  const validateDialogProps = useCallback((dialogType: DialogType, props?: DialogProps): DialogProps => {
    const validatedProps = props ? { ...props } : {};
    
    // Validate specific props based on dialog type
    switch (dialogType) {
      case 'appointment':
      case 'editAppointment':
      case 'appointmentDetails':
        // Ensure clinicianId is a string if provided
        if (validatedProps.clinicianId !== undefined && typeof validatedProps.clinicianId !== 'string') {
          console.warn(`[DialogContext] Invalid clinicianId for ${dialogType} dialog:`, validatedProps.clinicianId);
          validatedProps.clinicianId = String(validatedProps.clinicianId);
        }
        break;
        
      case 'weeklyAvailability':
        // Ensure selectedDate is a string or null
        if (validatedProps.selectedDate !== undefined &&
            validatedProps.selectedDate !== null &&
            typeof validatedProps.selectedDate !== 'string') {
          console.warn(`[DialogContext] Invalid selectedDate for ${dialogType} dialog:`, validatedProps.selectedDate);
          validatedProps.selectedDate = String(validatedProps.selectedDate);
        }
        break;
        
      case 'bookAppointment':
        // Validate time-related props
        if (validatedProps.startTime && typeof validatedProps.startTime !== 'string') {
          console.warn(`[DialogContext] Invalid startTime for ${dialogType} dialog:`, validatedProps.startTime);
          validatedProps.startTime = String(validatedProps.startTime);
        }
        
        if (validatedProps.endTime && typeof validatedProps.endTime !== 'string') {
          console.warn(`[DialogContext] Invalid endTime for ${dialogType} dialog:`, validatedProps.endTime);
          validatedProps.endTime = String(validatedProps.endTime);
        }
        break;
    }
    
    return validatedProps;
  }, []);

  const openDialog = useCallback((dialogType: DialogType, props?: DialogProps) => {
    const validatedProps = validateDialogProps(dialogType, props);
    dispatch({ type: 'OPEN_DIALOG', payload: { dialogType, props: validatedProps } });
  }, [validateDialogProps]);

  const closeDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_DIALOG' });
  }, []);

  const closeAllDialogs = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_DIALOGS' });
  }, []);

  const pushDialog = useCallback((dialogType: DialogType, props?: DialogProps) => {
    const validatedProps = validateDialogProps(dialogType, props);
    dispatch({ type: 'PUSH_DIALOG', payload: { dialogType, props: validatedProps } });
  }, [validateDialogProps]);

  const popDialog = useCallback(() => {
    dispatch({ type: 'POP_DIALOG' });
  }, []);

  const updateDialogProps = useCallback((props: DialogProps) => {
    // Validate props based on current dialog type
    const validatedProps = state.type ? validateDialogProps(state.type, props) : props;
    dispatch({ type: 'UPDATE_DIALOG_PROPS', payload: { props: validatedProps } });
  }, [state.type, validateDialogProps]);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  // Legacy support for existing components
  const isAppointmentDialogOpen = state.type === 'appointment';
  const isAvailabilitySettingsOpen = state.type === 'availabilitySettings';
  const isWeeklyAvailabilityOpen = state.type === 'weeklyAvailability';
  const isSingleAvailabilityOpen = state.type === 'singleAvailability';
  const isDiagnosticOpen = state.type === 'diagnostic';

  const openAppointmentDialog = useCallback(() => {
    openDialog('appointment');
  }, [openDialog]);

  const closeAppointmentDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const openAvailabilitySettings = useCallback(() => {
    openDialog('availabilitySettings');
  }, [openDialog]);

  const closeAvailabilitySettings = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const openWeeklyAvailability = useCallback((date: string | null = null) => {
    openDialog('weeklyAvailability', { selectedDate: date });
  }, [openDialog]);

  const closeWeeklyAvailability = useCallback(() => {
    localStorage.removeItem('selectedAvailabilitySlotId');
    localStorage.removeItem('selectedAvailabilityDate');
    closeDialog();
  }, [closeDialog]);

  const openSingleAvailability = useCallback(() => {
    openDialog('singleAvailability');
  }, [openDialog]);

  const closeSingleAvailability = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const openDiagnosticDialog = useCallback(() => {
    openDialog('diagnostic');
  }, [openDialog]);

  const closeDiagnosticDialog = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const contextValue: DialogContextType = {
    state,
    openDialog,
    closeDialog,
    closeAllDialogs,
    pushDialog,
    popDialog,
    updateDialogProps,
    goBack,
    
    // Legacy support
    isAppointmentDialogOpen,
    isAvailabilitySettingsOpen,
    isWeeklyAvailabilityOpen,
    isSingleAvailabilityOpen,
    isDiagnosticOpen,
    // Get selectedAvailabilityDate from state.props instead of separate state
    selectedAvailabilityDate: state.type === 'weeklyAvailability' ? state.props.selectedDate : null,
    openAppointmentDialog,
    closeAppointmentDialog,
    openAvailabilitySettings,
    closeAvailabilitySettings,
    openWeeklyAvailability,
    closeWeeklyAvailability,
    openSingleAvailability,
    closeSingleAvailability,
    openDiagnosticDialog,
    closeDiagnosticDialog
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
};

// Custom hook for using dialog context
export const useDialogs = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  return context;
};