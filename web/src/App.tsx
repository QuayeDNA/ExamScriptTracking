import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Exam Script Tracking System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Admin Dashboard - Coming Soon
        </p>
        <div className="space-x-4">
          <Link
            to="/about"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          About the System
        </h1>
        <p className="text-gray-700 mb-4">
          A comprehensive QR code-based solution to eliminate exam script loss
          and fraudulent claims by creating an auditable chain of custody from
          student submission through grading.
        </p>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Key Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>QR code tracking for students and script batches</li>
            <li>Real-time custody chain management</li>
            <li>Handshake transfer system</li>
            <li>Comprehensive audit trail</li>
            <li>Analytics and reporting dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
