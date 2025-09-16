import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ServiceType = 'planned' | 'unplanned' | 'emergency';

export interface ServiceLog {
  id: string;
  providerId: string;
  serviceOrder: string;
  carId: string;
  odometer: number;
  engineHours: number;
  startDate: string;
  endDate: string;
  type: ServiceType;
  serviceDescription: string;
  createdAt: string;
}

export interface Draft extends Omit<ServiceLog, 'id' | 'createdAt'> {
  id: string;
  lastSaved: string;
  isDirty: boolean;
}

export interface Filters {
  startDateFrom: string;
  startDateTo: string;
  type: ServiceType | '';
}

export interface RootStateServiceLog {
  serviceLogs: ServiceLog[];
  drafts: Draft[];
  currentDraft: Draft | null;
  searchTerm: string;
  filters: Filters;
  editingLog: ServiceLog | null;
  saveStatus: 'idle' | 'saving' | 'saved';
  validationErrors: string[];
  showFilters: boolean;
}

const createInitialDraft = (): Omit<Draft, 'id' | 'lastSaved' | 'isDirty'> => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    providerId: '',
    serviceOrder: '',
    carId: '',
    odometer: 0,
    engineHours: 0,
    startDate: today.toISOString().split('T')[0],
    endDate: tomorrow.toISOString().split('T')[0],
    type: 'planned',
    serviceDescription: ''
  };
};

const initialState: RootStateServiceLog = {
  serviceLogs: [],
  drafts: [],
  currentDraft: null,
  searchTerm: '',
  filters: { startDateFrom: '', startDateTo: '', type: '' },
  editingLog: null,
  saveStatus: 'idle',
  validationErrors: [],
  showFilters: false
};

const validateServiceLog = (data: Partial<ServiceLog> | Partial<Draft>): string[] => {
  const errors: string[] = [];

  if (!data.providerId?.trim()) errors.push('Provider ID is required');
  if (!data.serviceOrder?.trim()) errors.push('Service Order is required');
  if (!data.carId?.trim()) errors.push('Car ID is required');
  if (data.odometer === undefined || data.odometer < 0) errors.push('Valid odometer reading is required');
  if (data.engineHours === undefined || data.engineHours < 0) errors.push('Valid engine hours is required');
  if (!data.startDate) errors.push('Start date is required');
  if (!data.endDate) errors.push('End date is required');
  if (!data.serviceDescription?.trim()) errors.push('Service description is required');

  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    errors.push('End date must be after start date');
  }

  return errors;
};

const LOCAL_STORAGE_KEY = 'serviceLogManager_v1';

const slice = createSlice({
  name: 'serviceLog',
  initialState,
  reducers: {
    loadFromStorage(state, action: PayloadAction<Partial<RootStateServiceLog>>) {
      Object.assign(state, action.payload);
    },

    createDraft(state) {
      const newDraft: Draft = {
        ...createInitialDraft(),
        id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        lastSaved: new Date().toISOString(),
        isDirty: false
      };
      state.drafts.push(newDraft);
      state.currentDraft = newDraft;
    },

    setCurrentDraft(state, action: PayloadAction<Draft | null>) {
      state.currentDraft = action.payload;
    },

    updateDraft(state, action: PayloadAction<{ id: string; field: keyof Draft; value: any }>) {
      const { id, field, value } = action.payload;
      const draftIndex = state.drafts.findIndex(d => d.id === id);
      if (draftIndex === -1) return;

      const draft = { ...state.drafts[draftIndex] };
      (draft as any)[field] = value;
      draft.isDirty = true;

      // keep end date in sync when startDate changed
      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        draft.endDate = endDate.toISOString().split('T')[0];
      }

      state.drafts[draftIndex] = draft;
      if (state.currentDraft?.id === id) state.currentDraft = draft;
      state.saveStatus = 'saving';
    },

    deleteDraft(state, action: PayloadAction<string>) {
      state.drafts = state.drafts.filter(d => d.id !== action.payload);
      if (state.currentDraft?.id === action.payload) state.currentDraft = null;
    },

    clearAllDrafts(state) {
      state.drafts = [];
      state.currentDraft = null;
    },

    createServiceLog(state) {
      if (!state.currentDraft) {
        state.validationErrors = ['No draft selected'];
        return;
      }
      const errors = validateServiceLog(state.currentDraft);
      if (errors.length) {
        state.validationErrors = errors;
        return;
      }
      const newLog: ServiceLog = {
        ...state.currentDraft,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString()
      } as ServiceLog;

      state.serviceLogs.push(newLog);
      state.drafts = state.drafts.filter(d => d.id !== state.currentDraft!.id);
      state.currentDraft = null;
      state.validationErrors = [];
    },

    setEditingLog(state, action: PayloadAction<ServiceLog | null>) {
      state.editingLog = action.payload;
      state.validationErrors = [];
    },

    updateEditingLogField(state, action: PayloadAction<{ field: keyof ServiceLog; value: any }>) {
      if (!state.editingLog) return;
      const { field, value } = action.payload;
      const updated = { ...state.editingLog, [field]: value } as ServiceLog;

      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        updated.endDate = endDate.toISOString().split('T')[0];
      }

      state.editingLog = updated;
    },

    saveEditingLog(state) {
      if (!state.editingLog) return;
      const errors = validateServiceLog(state.editingLog);
      if (errors.length) {
        state.validationErrors = errors;
        return;
      }
      state.serviceLogs = state.serviceLogs.map(l => (l.id === state.editingLog!.id ? state.editingLog! : l));
      state.editingLog = null;
      state.showFilters = false;
      state.saveStatus = 'idle';
      state.validationErrors = [];
    },

    deleteServiceLog(state, action: PayloadAction<string>) {
      state.serviceLogs = state.serviceLogs.filter(l => l.id !== action.payload);
      if (state.editingLog?.id === action.payload) state.editingLog = null;
    },

    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },

    setFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },

    toggleFilters(state) {
      state.showFilters = !state.showFilters;
    },

    clearFilters(state) {
      state.searchTerm = '';
      state.filters = { startDateFrom: '', startDateTo: '', type: '' };
    },

    setSaveStatus(state, action: PayloadAction<'idle' | 'saving' | 'saved'>) {
      state.saveStatus = action.payload;
    },

    setValidationErrors(state, action: PayloadAction<string[]>) {
      state.validationErrors = action.payload;
    },

    // Persistence helper: mark a draft saved
    markDraftSaved(state, action: PayloadAction<{ id: string; lastSaved?: string }>) {
      const d = state.drafts.find(x => x.id === action.payload.id);
      if (!d) return;
      d.isDirty = false;
      d.lastSaved = action.payload.lastSaved ?? new Date().toISOString();
      if (state.currentDraft?.id === d.id) state.currentDraft = d;
    }
  }
});

export const {
  loadFromStorage,
  createDraft,
  setCurrentDraft,
  updateDraft,
  deleteDraft,
  clearAllDrafts,
  createServiceLog,
  setEditingLog,
  updateEditingLogField,
  saveEditingLog,
  deleteServiceLog,
  setSearchTerm,
  setFilters,
  toggleFilters,
  clearFilters,
  setSaveStatus,
  setValidationErrors,
  markDraftSaved
} = slice.actions;

// Simple persistence utilities
export const persistToLocalStorage = (state: RootStateServiceLog) => {
  try {
    const toSave = {
      serviceLogs: state.serviceLogs,
      drafts: state.drafts.map(d => ({ ...d, isDirty: false })),
      currentDraft: state.currentDraft ? { ...state.currentDraft, isDirty: false } : null
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    // ignore
  }
};

export const loadFromLocalStorage = (): Partial<RootStateServiceLog> | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export default slice.reducer;
