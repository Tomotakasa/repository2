import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GroupProvider, useGroup } from './contexts/GroupContext';
import { AddEditItemPage } from './pages/AddEditItemPage';
import { AuthPage } from './pages/AuthPage';
import { CategoryPage } from './pages/CategoryPage';
import { GroupSelectPage } from './pages/GroupSelectPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';

/** Redirect unauthenticated users to /auth */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
};

/** Redirect authenticated users away from /auth */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/home" replace />;
  return <>{children}</>;
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="flex flex-col items-center gap-4">
      <span className="text-5xl animate-bounce">🏠</span>
      <p className="text-gray-400 font-semibold text-sm">読み込み中...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '14px', fontWeight: 600, fontSize: '14px' },
          success: { iconTheme: { primary: '#FF6B9D', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/auth"   element={<PublicRoute><AuthPage /></PublicRoute>} />

        {/* Protected — requires auth but no group context */}
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupProvider>
                <GroupSelectPage />
              </GroupProvider>
            </ProtectedRoute>
          }
        />

        {/* Protected — requires group */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <GroupProvider>
                <AppRoutes />
              </GroupProvider>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
};

const AppRoutes: React.FC = () => {
  const { groups, loading } = useGroup();
  if (loading) return <LoadingScreen />;
  if (groups.length === 0) return <Navigate to="/groups" replace />;

  return (
    <Routes>
      <Route path="/home"              element={<HomePage />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/item/new"          element={<AddEditItemPage />} />
      <Route path="/item/:itemId/edit" element={<AddEditItemPage />} />
      <Route path="/settings"          element={<SettingsPage />} />
      <Route path="*"                  element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
