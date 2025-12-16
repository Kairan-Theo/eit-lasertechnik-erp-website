export default function HeroSection() {
  return (
    <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            {/* Handwritten-style headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                All your business
                <span className="relative inline-block mx-2">
                  operations
                  <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FFC107] opacity-30 -z-10"></span>
                </span>
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                in
                <span className="relative inline-block mx-2">
                  one place
                  <span className="absolute bottom-1 left-0 right-0 h-1 border-b-2 border-[#3D56A6]"></span>
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 max-w-lg">
              Simple to use, powerful for your team, built for modern manufacturing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary">
                Get started now — it's free!
              </button>
              <button className="btn-outline">
                Book a demo
              </button>
            </div>
          </div>

          {/* Right Side removed: pricing tag no longer shown */}
        </div>
      </div>
    </section>
  )
}
