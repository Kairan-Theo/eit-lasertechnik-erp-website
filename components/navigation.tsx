"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-[#3D56A6] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-[#3D56A6] font-bold">EIT</span>
            </div>
            <span>EIT Lasertechnik</span>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-white hover:text-gray-200 transition">
              App
            </Link>
            <Link href="#" className="text-white hover:text-gray-200 transition">
              Industry
            </Link>
            <Link href="#" className="text-white hover:text-gray-200 transition">
              Community
            </Link>
            <Link href="#" className="text-white hover:text-gray-200 transition">
              Pricing
            </Link>
            <Link href="#" className="text-white hover:text-gray-200 transition">
              Help
            </Link>
          </div>

          {/* Right Side - Log In and CTA */}
          <div className="flex items-center gap-4">
            <Link href="#" className="text-white hover:text-gray-200 transition hidden sm:block">
              Log in
            </Link>
            <Button className="bg-white text-[#3D56A6] hover:bg-gray-100 rounded-full px-6">Try it for free</Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
