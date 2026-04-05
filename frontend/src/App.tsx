import { Routes, Route, NavLink } from 'react-router-dom'
import PersonsPage from './pages/PersonsPage'
import FoodsPage from './pages/FoodsPage'
import WeekPlanPage from './pages/WeekPlanPage'

function App() {
  return (
    <div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          Persons
        </NavLink>
        <NavLink to="/foods" className={({ isActive }) => isActive ? 'active' : ''}>
          Foods
        </NavLink>
        <NavLink to="/weekplan" className={({ isActive }) => isActive ? 'active' : ''}>
          Week Plan
        </NavLink>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<PersonsPage />} />
          <Route path="/foods" element={<FoodsPage />} />
          <Route path="/weekplan" element={<WeekPlanPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
