import React from "react"
import ReactDOM from "react-dom/client"
import Navigation from "./components/navigation.jsx"
import { LanguageProvider } from "./components/language-context"
import "./index.css"

function SignupPage() {
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
            Sign up with Google (Dev)
          `
          mockButton.onclick = () => handleGoogleCallback({ credential: "mock_token_dev_user" })
          
          googleButtonRef.current.innerHTML = ''
          googleButtonRef.current.appendChild(mockButton)
        }
        return
      }

      // Load Google Identity Services script
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
          
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(
              googleButtonRef.current,
              { 
                theme: "outline", 
                size: "large", 
                text: "signup_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: googleButtonRef.current.offsetWidth 
              }
            )
          }
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
        localStorage.setItem("currentUser", JSON.stringify({ email: data.email, role: data.role, name: data.name, profile_picture: data.profile_picture, company: data.company }))
        window.location.href = "/apps.html"
      } else {
        alert(data.error || "Google signup failed")
      }
    } catch (err) {
      console.error("Google signup error:", err)
      alert("Unable to connect to server")
    }
  }

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
        if (data && data.verification_required && data.email) {
          alert("Account created successfully. A verification code was sent to your email.")
          const code = window.prompt("Enter the verification code from your email to verify your account:")
          if (code && code.trim()) {
            try {
              const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verify-email/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: data.email,
                  code: code.trim(),
                }),
              })
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.verified) {
                alert("Email verified successfully! Please log in.")
              } else {
                alert(verifyData.error || "Verification failed. You can try signing up again.")
              }
            } catch (err) {
              console.error("Verification error:", err)
              alert("Could not verify email. Please try again.")
            }
          } else {
            alert("Verification code not entered. You can sign up again to receive a new code.")
          }
        } else {
          alert("Account created successfully! Please log in.")
        }
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
          
          <div className="mb-6">
            <div className="flex justify-center w-full" ref={googleButtonRef}></div>
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
              </div>
            </div>
          </div>

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
