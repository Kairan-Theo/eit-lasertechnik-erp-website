import React from "react";
import ReactDOM from "react-dom/client";
import Navigation from "./components/navigation.jsx";
import { LanguageProvider } from "./components/language-context";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "./config";
import "./index.css";

function LoginPage() {
  const googleRef = React.useRef(null);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleGoogleLogin = React.useCallback(async (response) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Google login failed");
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("allowedApps", data.allowed_apps);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          email: data.email,
          role: data.role,
          name: data.name,
          profile_picture: data.profile_picture,
          company: data.company,
        }),
      );

      window.location.href = "apps.html";
    } catch (err) {
      console.error("Google login error:", err);
      setError(
        `Unable to connect to server: ${err.message || "Unknown error"}`,
      );
    }
  }, []);

  React.useEffect(() => {
    let script;

    const renderFallback = () => {
      if (!googleRef.current) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50";
      button.textContent = "Continue with Google";
      button.onclick = () =>
        handleGoogleLogin({ credential: "mock_token_dev_user" });
      googleRef.current.innerHTML = "";
      googleRef.current.appendChild(button);
    };

    if (!GOOGLE_CLIENT_ID) {
      renderFallback();
      return;
    }

    script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleRef.current) return;
      googleRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: googleRef.current.offsetWidth || 350,
      });
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      script.onload = renderGoogleButton;
    }
  }, [handleGoogleLogin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") || "").trim();

    if (!email || !password) {
      setError("Please provide both email and password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("allowedApps", data.allowed_apps);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          email: data.email,
          role: data.role,
          name: data.name,
          profile_picture: data.profile_picture,
          company: data.company,
        }),
      );

      window.location.href = "apps.html";
    } catch (err) {
      console.error("Login error:", err);
      setError(
        `Unable to connect to server: ${err.message || "Unknown error"}`,
      );
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <section className="w-full bg-linear-to-b from-gray-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Log in to EIT Lasertechnik
          </h1>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="********"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-[#3D56A6]"
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
            <button
              type="submit"
              className="w-full rounded-md bg-[#3D56A6] px-4 py-2 font-semibold text-white transition hover:bg-[#334b93]"
            >
              Log in
            </button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            <div ref={googleRef} className="mt-4 flex w-full justify-center" />
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Do not have an account?{" "}
            <a href="signup.html" className="text-[#2D4485] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <LoginPage />
    </LanguageProvider>
  </React.StrictMode>,
);
