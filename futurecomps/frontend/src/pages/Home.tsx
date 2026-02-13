import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating AI Chat Button */}
      <Link to="/ai-chat" className="fixed bottom-6 right-6 z-50 group">
        <div className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 flex items-center space-x-3">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-semibold text-lg pr-2 hidden group-hover:inline">
            Chat with AI
          </span>
        </div>
      </Link>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Platform
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A complete authentication system with email verification, password
            reset, and profile management.
          </p>
          <div className="space-x-4">
            <Link
              to="/ai-chat"
              className="inline-block px-8 py-3 text-base font-medium text-white bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-md shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              💬 Try AI Chat (No Login)
            </Link>
            <Link
              to="/login"
              className="inline-block px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-block px-6 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 border border-blue-600 rounded-md"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-linear-to-br from-blue-600 to-cyan-600 p-6 rounded-lg shadow-xl text-white transform hover:scale-105 transition-all">
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              AI Chat Assistant
            </h3>
            <p className="text-blue-100 mb-3">
              Chat with our AI powered by Google Gemini. No login required!
            </p>
            <Link
              to="/ai-chat"
              className="inline-block px-4 py-2 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition"
            >
              Start Chatting →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🔐 Secure Authentication
            </h3>
            <p className="text-gray-600">
              Email verification with OTP, secure password hashing, and JWT
              tokens.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              👤 Profile Management
            </h3>
            <p className="text-gray-600">
              Update your profile information, change password, and manage your
              account.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              📧 Email Features
            </h3>
            <p className="text-gray-600">
              Password reset via email, OTP verification, and welcome emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
