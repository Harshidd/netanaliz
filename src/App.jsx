import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Pages & Modules
import Home from './pages/Home'
import ExamAnalysis from './modules/ExamAnalysis'
import ClassManagement from './modules/ClassManagement'

function App() {
  return (
    <Router>
      <Routes>
        {/* Module Selection Home */}
        <Route path="/" element={<Home />} />

        {/* Exam Analysis Module */}
        <Route path="/exams/*" element={<ExamAnalysis />} />

        {/* Class Management Module */}
        <Route path="/class/*" element={<ClassManagement />} />

        {/* Redirects for legacy users if any specific subroutes existed, though mostly it was root */}
        <Route path="/analiz" element={<Navigate to="/exams" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
