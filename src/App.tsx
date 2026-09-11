import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import Overview from '@/pages/Overview'
import Analytics from '@/pages/Analytics'
import Reports from '@/pages/Reports'
import Customers from '@/pages/Customers'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}
