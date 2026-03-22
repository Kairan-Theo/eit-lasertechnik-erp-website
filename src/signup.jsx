import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "./config"
import "./index.css"

function SignupPage() {
  const googleRef = React.useRef(null)
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [showPassword, setShowPassword] = React.useState(false)

  const handleGoogleSignup = React.useCallback(async (response) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Google signup failed")
        return
      }

      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userRole", data.role)
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("allowedApps", data.allowed_apps)
      localStorage.setItem("currentUser", JSON.stringify({
        email: data.email,
        role: data.role,
        name: data.name,
        profile_picture: data.profile_picture,
        company: data.company,
      }))

      window.location.href = "apps.html"
    } catch (err) {
      console.error("Google signup error:", err)
      alert("Unable to connect to server")
    }
  }, [])

  React.useEffect(() => {
    let script

    const renderFallback = () => {
      if (!googleRef.current) return

      const button = document.createElement("button")
      button.type = "button"
      button.className = "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      button.textContent = "Sign up with Google"
      button.onclick = () => handleGoogleSignup({ credential: "mock_token_dev_user" })
      googleRef.current.innerHTML = ""
      googleRef.current.appendChild(button)
    }

    if (!GOOGLE_CLIENT_ID) {
      renderFallback()
      return
    }

    script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleRef.current) return
      googleRef.current.innerHTML = ""
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignup,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: googleRef.current.offsetWidth || 350,
      })
    }

    if (window.google) {
      renderGoogleButton()
    } else {
      script.onload = renderGoogleButton
    }
  }, [handleGoogleSignup])

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((current) => ({ ...current, [id]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const password = form.password.trim()
    const confirm = form.confirm.trim()

    if (!name || !email || !password || !confirm) {
      alert("Please fill out all fields")
      return
    }

    if (password !== confirm) {
      alert("Passwords do not match")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          email,
          password,
          first_name: name,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        const message = data.username ? "Email already taken" : (data.email?.[0] || "Signup failed")
        alert(message)
        return
      }

      alert("Account created successfully! Please log in.")
      window.location.href = "login.html"
    } catch (err) {
      console.error("Signup error:", err)
      alert(`An error occurred during signup: ${err.message || "Unknown error"}`)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-gradient-to-b from-gray-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Create your account</h1>
          <div className="mb-6">
            <div ref={googleRef} className="flex w-full justify-center" />
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Your name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="********"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
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
              <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                id="confirm"
                type="password"
                required
                placeholder="********"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
                value={form.confirm}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="w-full rounded-md bg-[#3D56A6] px-4 py-2 font-semibold text-white transition hover:bg-[#334b93]">
              Sign up
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account? <a href="login.html" className="text-[#3D56A6] hover:underline">Log in</a>
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
