import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import VenueFinder from './components/VenueFinder/VenueFinder'
import ProfilePage from './components/ProfilePage'
import FriendsPage from './components/Friends/FriendsPage'
import GroupsPage from './components/Groups/GroupsPage'
import { UserProvider, UserContext } from './contexts/UserContext'
import ProfileDropdown from './components/ProfileDropdown'
import { Menu, X } from 'lucide-react'
import './App.css'

function Navigation() {
  const { user } = useContext(UserContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-lg sm:text-xl font-bold">MeetMe</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Venue Finder
              </Link>
              {user && (
                <>
                  <Link
                    to="/friends"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Friends
                  </Link>
                  <Link
                    to="/groups"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Groups
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <ProfileDropdown />
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden ml-1 inline-flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 min-w-[44px] min-h-[44px]"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 bg-gray-50">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block pl-4 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-300 active:bg-gray-100 min-h-[48px] flex items-center"
            >
              Venue Finder
            </Link>
            {user && (
              <>
                <Link
                  to="/friends"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-4 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-300 active:bg-gray-100 min-h-[48px] flex items-center"
                >
                  Friends
                </Link>
                <Link
                  to="/groups"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-4 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-300 active:bg-gray-100 min-h-[48px] flex items-center"
                >
                  Groups
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useContext(UserContext);
  return user ? children : <Navigate to="/" />;
}

function AppContent() {
  return (
    <div className="app min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<VenueFinder />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Made with ❤️ by Tim Bettison
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  )
}

export default App
