"use client"

export default function Navigation() {
  const handleLogoClick = () => {
    window.location.href = "/"
  }

  const handleNavClick = (e) => {
    e.preventDefault()
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#3D56A6] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-bold text-lg cursor-pointer hover:opacity-90 transition"
          >
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-[#3D56A6] font-bold">EIT</span>
            </div>
            <span>EIT Lasertechnik</span>
          </button>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition">
              App
            </a>
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition">
              Industry
            </a>
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition">
              Community
            </a>
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition">
              Pricing
            </a>
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition">
              Help
            </a>
          </div>

          {/* Right Side - Log In and CTA */}
          <div className="flex items-center gap-4">
            <a href="#" onClick={handleNavClick} className="text-white hover:text-gray-200 transition hidden sm:block">
              Log in
            </a>
            <button className="bg-white text-[#3D56A6] hover:bg-gray-100 rounded-full px-6 py-2 font-semibold transition">
              Try it for free
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
