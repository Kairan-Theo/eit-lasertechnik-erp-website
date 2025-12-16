import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import "./index.css"
// Inline SVG icons to avoid external dependency issues
const EyeIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M3 3l18 18" />
  </svg>
)

function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault()
    const formEl = e.target
    const email = formEl.querySelector("#email")?.value || ""
    const role = /admin/i.test(email) ? "Admin" : "User"
    try {
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userRole", role)
      localStorage.setItem("currentUser", JSON.stringify({ email, role }))
    } catch {}
    window.location.href = "/apps.html"
  }

  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Log in to EIT Lasertechnik</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                />
                <button
                  type="button"
                  aria-label="Hold to view password"
                  title="Hold to view password"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 bg-transparent px-2 py-1 rounded"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                >
                  {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full btn-primary font-semibold"
            >
              Log in
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Don’t have an account? <a href="/signup.html" className="text-[#2D4485] hover:underline">Sign up</a>
          </p>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoginPage />
  </React.StrictMode>
)
