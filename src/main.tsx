import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store.ts'
import { ServiceLogManager } from './ServiceLogManager.tsx'
import './output.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Service Log Manager - Development
          </h1>
          <ServiceLogManager />
        </div>
      </div>
    </Provider>
  </React.StrictMode>,
)