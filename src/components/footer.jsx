export default function Footer() {
  return (
    <footer className="w-full bg-[#3D56A6] text-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Column 1: Logo & Description */}
          <div>
            <div className="flex items-center gap-2 font-bold text-base mb-3">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                <span className="text-[#3D56A6] font-bold text-[10px]">EIT</span>
              </div>
              <span>Lasertechnik</span>
            </div>
            <p className="text-xs text-gray-100">ERP for precision manufacturing teams.</p>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h4 className="font-bold text-xs mb-2">Product</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company Info */}
          <div>
            <h4 className="font-bold text-xs mb-2">Company</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Contact */}
          <div>
            <h4 className="font-bold text-xs mb-2">Support</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-100 hover:text-white transition">
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Divider & Copyright */}
        <div className="border-t border-gray-300 pt-4">
          <p className="text-xs text-gray-100">© {new Date().getFullYear()} EIT Lasertechnik. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
