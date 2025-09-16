import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import {
  loadFromStorage,
  loadFromLocalStorage,
  persistToLocalStorage,
  createDraft,
  setCurrentDraft,
  updateDraft,
  deleteDraft,
  clearAllDrafts,
  createServiceLog,
  setSearchTerm,
  toggleFilters,
  setFilters,
  clearFilters,
  setEditingLog,
  updateEditingLogField,
  saveEditingLog,
  deleteServiceLog,
  markDraftSaved,
  setSaveStatus
} from './serviceLogSlice';

import * as Dialog from '@radix-ui/react-dialog';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

import {
  Search,
  Plus,
  Trash2,
  Edit,
  Save,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  X
} from 'lucide-react';

export const ServiceLogManager: React.FC = () => {
  const state = useSelector((s: RootState) => s.serviceLog);
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // load persisted state once
  useEffect(() => {
    const persisted = loadFromLocalStorage();
    if (persisted) {
      dispatch(loadFromStorage(persisted));
    }
    setIsInitialLoad(false);
  }, [dispatch]);

  // persist to localStorage on any state change (except initial load)
  useEffect(() => {
    if (isInitialLoad) return;
    persistToLocalStorage(state);
  }, [state, isInitialLoad]);

  // auto-save drafts with debouncing
  useEffect(() => {
    if (!state.currentDraft?.isDirty) return;

    dispatch(setSaveStatus('saving'));
    const draftId = state.currentDraft.id;
    
    const saveTimer = setTimeout(() => {
      dispatch(markDraftSaved({ id: draftId }));
      dispatch(setSaveStatus('saved'));
      
      const resetTimer = setTimeout(() => {
        dispatch(setSaveStatus('idle'));
      }, 2000);
      
      return () => clearTimeout(resetTimer);
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [state.currentDraft?.isDirty, state.currentDraft?.id, dispatch]);

  const getSaveStatusIcon = () => {
    switch (state.saveStatus) {
      case 'saving':
        return <Clock className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'saved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'unplanned':
        return 'bg-yellow-100 text-yellow-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = state.serviceLogs.filter(log => {
    const matchesSearch =
      state.searchTerm === '' ||
      Object.values(log).some(value =>
        value.toString().toLowerCase().includes(state.searchTerm.toLowerCase())
      );

    const matchesDateRange =
      (!state.filters.startDateFrom || log.startDate >= state.filters.startDateFrom) &&
      (!state.filters.startDateTo || log.startDate <= state.filters.startDateTo);

    const matchesType = !state.filters.type || log.type === state.filters.type;

    return matchesSearch && matchesDateRange && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Log Management System</h1>
          <p className="text-gray-600">
            Redux Toolkit + Radix UI + TypeScript + Tailwind example
          </p>
        </div>

        {/* Form / Draft area */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Service Log Form</h2>
            <div className="flex items-center space-x-2">
              {getSaveStatusIcon()}
              {state.saveStatus === 'saving' && (
                <span className="text-sm text-yellow-600 font-medium">Auto-saving draft...</span>
              )}
              {state.saveStatus === 'saved' && (
                <span className="text-sm text-green-600 font-medium">✓ Draft saved</span>
              )}
              {state.currentDraft && !state.currentDraft.isDirty && state.saveStatus === 'idle' && (
                <span className="text-sm text-gray-500">All changes saved</span>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Drafts */}
            {state.drafts.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-3">Available Drafts ({state.drafts.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {state.drafts.map(draft => (
                    <div key={draft.id} className="flex items-center space-x-1">
                      <button
                        onClick={() => dispatch(setCurrentDraft(draft))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                          state.currentDraft?.id === draft.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span>{draft.serviceOrder || `Draft ${draft.id.slice(-4)}`}</span>
                        {!draft.isDirty && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <button onClick={() => dispatch(deleteDraft(draft.id))} className="p-1 text-red-500 hover:text-red-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form fields */}
            {state.currentDraft ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID *</label>
                    <input
                      type="text"
                      value={state.currentDraft.providerId}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'providerId', value: e.target.value }))}
                      placeholder="Enter provider identifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Order *</label>
                    <input
                      type="text"
                      value={state.currentDraft.serviceOrder}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'serviceOrder', value: e.target.value }))}
                      placeholder="Enter service order number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Car ID *</label>
                    <input
                      type="text"
                      value={state.currentDraft.carId}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'carId', value: e.target.value }))}
                      placeholder="Enter car identifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (mi) *</label>
                    <input
                      type="number"
                      value={state.currentDraft.odometer}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'odometer', value: Number(e.target.value) || 0 }))}
                      placeholder="Current mileage"
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Engine Hours *</label>
                    <input
                      type="number"
                      value={state.currentDraft.engineHours}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'engineHours', value: Number(e.target.value) || 0 }))}
                      placeholder="Total engine hours"
                      min={0}
                      step={0.1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={state.currentDraft.startDate}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'startDate', value: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={state.currentDraft.endDate}
                      onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'endDate', value: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                    <ToggleGroup.Root
                      type="single"
                      value={state.currentDraft.type}
                      onValueChange={(v: string) =>
                        dispatch(updateDraft({ id: state.currentDraft!.id, field: 'type', value: v as any }))
                      }
                      className="inline-flex gap-2"
                    >
                      <ToggleGroup.Item className={`px-2 py-1 rounded-md text-sm ${state.currentDraft.type === 'planned' ? 'bg-blue-600 text-white' : 'bg-white border'}`} value="planned">Planned</ToggleGroup.Item>
                      <ToggleGroup.Item className={`px-2 py-1 rounded-md text-sm ${state.currentDraft.type === 'unplanned' ? 'bg-yellow-500 text-white' : 'bg-white border'}`} value="unplanned">Unplanned</ToggleGroup.Item>
                      <ToggleGroup.Item className={`px-2 py-1 rounded-md text-sm ${state.currentDraft.type === 'emergency' ? 'bg-red-600 text-white' : 'bg-white border'}`} value="emergency">Emergency</ToggleGroup.Item>
                    </ToggleGroup.Root>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Description *</label>
                  <textarea
                    value={state.currentDraft.serviceDescription}
                    onChange={(e) => dispatch(updateDraft({ id: state.currentDraft!.id, field: 'serviceDescription', value: e.target.value }))}
                    rows={4}
                    placeholder="Detailed description of service performed..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Validation errors */}
                {state.validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {state.validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Selected</h3>
                <p className="text-gray-600 mb-4">Create a new draft to start entering service log data.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => dispatch(createDraft())}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Create New Draft
              </button>

              {state.currentDraft && (
                <>
                  <button
                    onClick={() => dispatch(createServiceLog())}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" /> Create Service Log
                  </button>

                  <button
                    onClick={() => dispatch(deleteDraft(state.currentDraft!.id))}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Draft
                  </button>
                </>
              )}

              {state.drafts.length > 0 && (
                <button onClick={() => dispatch(clearAllDrafts())} className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All Drafts
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Service Logs listing */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Service Logs ({state.serviceLogs.length})</h2>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={state.searchTerm}
                    onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => dispatch(toggleFilters())}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    state.showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" /> Filters
                </button>
              </div>
            </div>

            {/* Filters */}
            {state.showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date From</label>
                    <input
                      type="date"
                      value={state.filters.startDateFrom}
                      onChange={(e) => dispatch(setFilters({ startDateFrom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date To</label>
                    <input
                      type="date"
                      value={state.filters.startDateTo}
                      onChange={(e) => dispatch(setFilters({ startDateTo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                      value={state.filters.type}
                      onChange={(e) => dispatch(setFilters({ type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="planned">Planned</option>
                      <option value="unplanned">Unplanned</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => dispatch(clearFilters())} className="mt-3 text-sm text-blue-600 hover:text-blue-800">Clear all filters</button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {filteredLogs.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.serviceOrder}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.carId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.providerId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(log.type)}`}>{log.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.odometer.toLocaleString()} mi</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => dispatch(setEditingLog(log))} className="text-blue-600 hover:text-blue-800" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => dispatch(deleteServiceLog(log.id))} className="text-red-600 hover:text-red-800" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No service logs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {state.serviceLogs.length === 0 ? 'Create your first service log by filling out the form above.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Radix Dialog for Edit */}
        <Dialog.Root open={!!state.editingLog} onOpenChange={(open) => { if (!open) dispatch(setEditingLog(null)); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium text-gray-900">Edit Service Log</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </Dialog.Close>
              </div>

              {state.editingLog && (
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID *</label>
                        <input
                          type="text"
                          value={state.editingLog.providerId}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'providerId', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Order *</label>
                        <input
                          type="text"
                          value={state.editingLog.serviceOrder}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'serviceOrder', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Car ID *</label>
                        <input
                          type="text"
                          value={state.editingLog.carId}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'carId', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                        <select
                          value={state.editingLog.type}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'type', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="planned">Planned</option>
                          <option value="unplanned">Unplanned</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (mi) *</label>
                        <input
                          type="number"
                          value={state.editingLog.odometer}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'odometer', value: Number(e.target.value) }))}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Engine Hours *</label>
                        <input
                          type="number"
                          value={state.editingLog.engineHours}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'engineHours', value: Number(e.target.value) }))}
                          min={0}
                          step={0.1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                        <input
                          type="date"
                          value={state.editingLog.startDate}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'startDate', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                        <input
                          type="date"
                          value={state.editingLog.endDate}
                          onChange={(e) => dispatch(updateEditingLogField({ field: 'endDate', value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Description *</label>
                      <textarea
                        value={state.editingLog.serviceDescription}
                        onChange={(e) => dispatch(updateEditingLogField({ field: 'serviceDescription', value: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    {state.validationErrors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {state.validationErrors.map((error, i) => <li key={i}>• {error}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={() => dispatch(saveEditingLog())} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </button>
                    <Dialog.Close asChild>
                      <button onClick={() => dispatch(setEditingLog(null))} className="inline-flex items-center px-4 py-2 bg-white border rounded-md">
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};


