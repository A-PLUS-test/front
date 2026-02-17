import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/UploadDocument';
import QuizSettings from './pages/QuizSettings';
import QuizTaking from './pages/QuizTaking';
import QuizResult from './pages/QuizResult';
import Vocabulary from './pages/Vocabulary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadDocument /></ProtectedRoute>} />
          <Route path="/quiz/settings/:documentId" element={<ProtectedRoute><QuizSettings /></ProtectedRoute>} />
          <Route path="/quiz/take/:quizId" element={<ProtectedRoute><QuizTaking /></ProtectedRoute>} />
          <Route path="/quiz/result/:resultId" element={<ProtectedRoute><QuizResult /></ProtectedRoute>} />
          <Route path="/vocabulary/:documentId" element={<ProtectedRoute><Vocabulary /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
