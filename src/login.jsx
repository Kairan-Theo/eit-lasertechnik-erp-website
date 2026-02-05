import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
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

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

function LoginPage() {
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const googleButtonRef = React.useRef(null)

  React.useEffect(() => {
    const initGoogle = async () => {
      const { GOOGLE_CLIENT_ID } = await import("./config.js")
      
      // Check if we are using the placeholder ID
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || GOOGLE_CLIENT_ID.includes("placeholder")) {
        console.warn("Google Client ID not set. Using Mock Mode.")
        // Render a mock button
        if (googleButtonRef.current) {
          const mockButton = document.createElement("button")
          mockButton.type = "button"
          mockButton.className = "w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          mockButton.innerHTML = `
            <svg viewBox="0 0 24 24" class="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google (Dev)
          `
          mockButton.onclick = () => handleGoogleCallback({ credential: "mock_token_dev_user" })
          
          googleButtonRef.current.innerHTML = ''
          googleButtonRef.current.appendChild(mockButton)
        }
        return
      }

      // Load Google Identity Services script for Real ID
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      document.body.appendChild(script)

      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true
          })
          
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            { 
              theme: "outline", 
              size: "large", 
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "left",
              width: googleButtonRef.current?.offsetWidth || 350
            }
          )
        }
      }
    }

    initGoogle()

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (script) document.body.removeChild(script)
    }
  }, [])

  const handleGoogleCallback = async (response) => {
    try {
      const { API_BASE_URL } = await import("./config.js")
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (res.ok) {
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
          account_type: data.account_type
        }))
        window.location.href = "/apps.html"
      } else {
        setError(data.error || "Google login failed")
      }
    } catch (err) {
      console.error("Google login error:", err)
      setError(`Unable to connect to server: ${err.message || "Unknown error"}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const formEl = e.target
    const email = (formEl.querySelector("#email")?.value || "").trim().toLowerCase()
    const password = (formEl.querySelector("#password")?.value || "").trim()
    if (!email || !password) {
      setError("Please provide both email and password")
      return
    }

    try {
      const { API_BASE_URL } = await import("./config.js")
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
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
          account_type: data.account_type
        }))
        window.location.href = "/apps.html"
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Unable to connect to server: " + (err.message || "Unknown error"))
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Log in to EIT Lasertechnik</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
          
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 flex justify-center w-full" ref={googleButtonRef}></div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account? <a href="/signup.html" className="text-[#2D4485] hover:underline">Sign up</a>
          </p>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <LoginPage />
    </LanguageProvider>
  </React.StrictMode>
)
