import { Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './Navbar'
import HomePage from './pages/homepage/HomePage'
import Market from './pages/market/Market'
import Bets from './pages/bets/Bets'
import Admin from './pages/admin/AdminPage'
import MarketDetails from './pages/market/components/MarketDetails'
import AdminMarkets from './pages/adminMarkets/AdminMarkets'

function App() {

  return (
    <>
       <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/markets" element={<Market />} />
        <Route path="/markets/:marketId" element={<MarketDetails />} />
        <Route path="/bets" element={<Bets />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/markets" element={<AdminMarkets />} />
          {/* <Route path="/markets" element={<Markets />} />
          <Route path="/markets/:id" element={<MarketDetail />} />
          <Route path="/bets" element={<Bets />} />
          <Route path="/bets/:id" element={<BetDetail />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* <Route path="*" element={<NotFound />} /> */} 
        </Routes>
    </>
  )
}

export default App
