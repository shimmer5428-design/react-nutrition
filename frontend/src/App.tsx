import { Routes, Route, NavLink } from 'react-router-dom'
import PersonsPage from './pages/PersonsPage'
import FoodsPage from './pages/FoodsPage'
import WeekPlanPage from './pages/WeekPlanPage'
import DashboardPage from './pages/DashboardPage'
import DayEditorPage from './pages/DayEditorPage'

function App() {
  return (
    <div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          總覽
        </NavLink>
        <NavLink to="/persons" className={({ isActive }) => isActive ? 'active' : ''}>
          Family Members
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/persons" element={<PersonsPage />} />
          <Route path="/foods" element={<FoodsPage />} />
          <Route path="/weekplan" element={<WeekPlanPage />} />
          <Route path="/edit/:weekId/:personName/:dayOfWeek" element={<DayEditorPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
