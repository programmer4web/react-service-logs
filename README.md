# Service Log Manager

A modern React component for managing service logs with autosave functionality and persistent storage. Built with TypeScript, Redux Toolkit, and Tailwind CSS.

## ✨ Features

- **📝 Draft Management** - Create and manage multiple service log drafts
- **🔄 Auto-save** - Form fields automatically save as you type (1-second debounce)
- **💾 Persistent Storage** - Data persists across browser sessions using localStorage
- **🔍 Search & Filter** - Find logs by content, date range, and service type
- **✏️ Edit Functionality** - Modify existing service logs with validation
- **🎨 Modern UI** - Clean, responsive interface built with Tailwind CSS
- **⚡ Fast Development** - Vite-powered development environment with HMR
- **🛡️ Type Safe** - Full TypeScript support with strict type checking

## 🚀 Quick Start

### Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Open http://localhost:3000
```

### Building

```bash
# Build for production
yarn build

# Preview production build
yarn preview

# Type checking
yarn type-check
```

## 📋 Usage

### Basic Workflow

1. **Create a Draft**
   - Click "Create New Draft"
   - Fill in service details (Provider ID, Service Order, Car ID, etc.)
   - Data auto-saves as you type

2. **Manage Drafts**
   - Switch between multiple drafts
   - Delete drafts you no longer need
   - Visual indicators show save status

3. **Create Service Logs**
   - Complete the form with all required fields
   - Click "Create Service Log"
   - Log appears in the table below

4. **Search and Filter**
   - Use the search bar to find specific logs
   - Apply filters by date range and service type
   - Clear filters to view all logs

5. **Edit Existing Logs**
   - Click the edit icon on any log
   - Modify details in the popup dialog
   - Save changes to update the log

### Data Persistence

All data automatically persists to localStorage:
- **Drafts** - Save form progress, resume later
- **Service Logs** - Permanent records survive page refresh
- **Current State** - Selected draft and form data maintained

## 🏗️ Architecture

### Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management with RTK
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool and dev server

### Project Structure

```
src/
├── ServiceLogManager.tsx    # Main component
├── serviceLogSlice.ts       # Redux slice with actions
├── store.ts                 # Redux store configuration
├── main.tsx                 # Development entry point
├── index.js                 # Library export
└── output.css              # Tailwind CSS
```

### State Management

The application uses Redux Toolkit for state management:

```typescript
interface RootStateServiceLog {
  serviceLogs: ServiceLog[];      // Completed service logs
  drafts: Draft[];               // Draft forms in progress
  currentDraft: Draft | null;    // Currently selected draft
  searchTerm: string;            // Search filter
  filters: Filters;              // Date and type filters
  editingLog: ServiceLog | null; // Log being edited
  saveStatus: 'idle' | 'saving' | 'saved';
  validationErrors: string[];
  showFilters: boolean;
}
```

## 📚 API

### ServiceLog Interface

```typescript
interface ServiceLog {
  id: string;
  providerId: string;
  serviceOrder: string;
  carId: string;
  odometer: number;
  engineHours: number;
  startDate: string;
  endDate: string;
  type: 'planned' | 'unplanned' | 'emergency';
  serviceDescription: string;
  createdAt: string;
}
```

### Draft Interface

```typescript
interface Draft extends Omit<ServiceLog, 'id' | 'createdAt'> {
  id: string;
  lastSaved: string;
  isDirty: boolean;
}
```

## 🎯 Key Features Explained

### Auto-save Mechanism

- **Trigger**: Form field changes mark draft as "dirty"
- **Debounce**: 1-second delay prevents excessive saves
- **Feedback**: Visual indicators show save progress
- **Persistence**: Data saves to localStorage immediately

### Data Validation

- Required field validation
- Date range validation (end date after start date)
- Numeric validation for odometer and engine hours
- Real-time error display

### localStorage Schema

```javascript
// Key: 'serviceLogManager_v1'
{
  serviceLogs: ServiceLog[],
  drafts: Draft[],
  currentDraft: Draft | null
}
```

## 🛠️ Development

### Available Scripts

```json
{
  "dev": "vite",              // Start development server
  "build": "vite build",      // Build for production
  "preview": "vite preview",  // Preview production build
  "build:css": "npx postcss src/output.css -o dist/index.css",
  "type-check": "tsc --noEmit", // TypeScript type checking
  "lint": "echo 'No linter configured'"
}
```

### Environment Setup

- **Node.js** 18+ required
- **Yarn** package manager
- **TypeScript** 5.x
- **Vite** 5.x for development

### Browser Support

- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙋‍♂️ Support

For questions or issues, please open an issue on the [GitHub repository](https://github.com/programmer4web/react-service-logs).

---

**Built with ❤️ using React, TypeScript, and modern web technologies**