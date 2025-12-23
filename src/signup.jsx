import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  })

  const onChange = (e) => {
    const { id, value } = e.target
    setForm((f) => ({ ...f, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = (form.name || "").trim()
    const email = (form.email || "").trim().toLowerCase()
    const password = (form.password || "").trim()
    const confirm = (form.confirm || "").trim()
    if (!name || !email || !password || !confirm) {
      alert("Please fill out all fields")
      return
    }
    if (password !== confirm) {
      alert("Passwords do not match")
      return
    }
    
    try {
      const { API_BASE_URL } = await import("./config.js")
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          email: email,
          password: password,
          first_name: name
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // User requirement: after sign up, it need to log iin again
        alert("Account created successfully! Please log in.")
        window.location.href = "/login.html"
      } else {
        // Handle errors (e.g., username already exists)
        const errorMsg = data.username ? `Email already taken` : (data.email ? data.email[0] : "Signup failed")
        alert(errorMsg)
      }
    } catch (error) {
      console.error("Signup error:", error)
      alert("An error occurred during signup: " + (error.message || "Unknown error"))
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create your account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                value={form.name}
                onChange={onChange}
              />
            </div>
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
                value={form.email}
                onChange={onChange}
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
                  value={form.password}
                  onChange={onChange}
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
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                value={form.confirm}
                onChange={onChange}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#3D56A6] text-white rounded-md px-4 py-2 font-semibold hover:bg-[#334b93] transition"
            >
              Sign up
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <a href="/login.html" className="text-[#3D56A6] hover:underline">Log in</a>
          </p>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SignupPage />
  </React.StrictMode>,
)
