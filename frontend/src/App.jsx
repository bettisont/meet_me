import VenueFinder from './components/VenueFinder/VenueFinder'
import { UserProvider } from './contexts/UserContext'
import './App.css'

function App() {
  return (
    <UserProvider>
      <div className="app">
        <VenueFinder />
      </div>
    </UserProvider>
  )
}

export default App
