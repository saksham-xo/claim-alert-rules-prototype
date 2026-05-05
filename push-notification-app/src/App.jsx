import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './data/store';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Toast from './components/shared/Toast';
import Communication from './pages/Communication';
import CreateTemplate from './pages/CreateTemplate';
import ViewTemplate from './pages/ViewTemplate';

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="flex flex-col h-screen">
          <div className="shrink-0 sticky top-0 z-30">
            <Topbar />
          </div>
          <div className="flex-1 overflow-y-auto bg-page">
            <div className="max-w-[1440px] w-full mx-auto px-8 py-6">
              <div className="flex gap-6">
                <Sidebar />
                <main className="flex-1 min-w-0">
                  <Routes>
                    <Route path="/" element={<Navigate to="/communication" replace />} />
                    <Route path="/communication" element={<Communication />} />
                    <Route path="/communication/new" element={<CreateTemplate mode="create" />} />
                    <Route path="/communication/:id" element={<ViewTemplate />} />
                    <Route path="/communication/:id/edit" element={<CreateTemplate mode="edit" />} />
                  </Routes>
                </main>
              </div>
            </div>
          </div>
        </div>
        <Toast />
      </StoreProvider>
    </BrowserRouter>
  );
}
