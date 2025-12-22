import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Team from './pages/Team'
import Delivery from './pages/Delivery'
import Booking from './pages/Booking'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import SuperAdmin from './pages/SuperAdmin'
import AnalyticsPage from './pages/Analytics'
import Services from './pages/Services'
import BroadcastPost from './pages/BroadcastPost'
import Users from './pages/Users'
import NotFound from './pages/NotFound'
import { useEffect } from 'react'

function App() {
  // #region agent log
  useEffect(()=>{
    const analyticsCheck=()=>{
      const analyticsInfo={hasAnalytics:true,windowSentry:typeof window!=='undefined'?!!window.Sentry:false};
      fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:23',message:'Analytics component check',data:analyticsInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    };
    analyticsCheck();
    setTimeout(analyticsCheck,2000);
  },[]);
  // #endregion
  
  // #region agent log
  useEffect(()=>{
    fetch('http://127.0.0.1:7244/ingest/e9ac047d-2973-4d8a-be65-54e78070a4b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:32',message:'Analytics component about to render',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  },[]);
  // #endregion

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/team" element={<Team />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/services" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Services />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/broadcast" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <BroadcastPost />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Analytics />
    </Router>
  )
}

export default App
