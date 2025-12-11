import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-[#3D56A6] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo & Description */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-[#3D56A6] font-bold text-xs">EIT</span>
              </div>
              <span>EIT Lasertechnik</span>
            </div>
            <p className="text-sm text-gray-100">Enterprise resource planning for precision manufacturing teams.</p>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h4 className="font-bold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company Info */}
          <div>
            <h4 className="font-bold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-100 hover:text-white transition">
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Divider & Copyright */}
        <div className="border-t border-gray-300 pt-8">
          <p className="text-sm text-gray-100">© {new Date().getFullYear()} EIT Lasertechnik. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
