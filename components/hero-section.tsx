import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            {/* Handwritten-style headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                All your business
                <span className="relative inline-block mx-2">
                  operations
                  <span className="absolute bottom-0 left-0 right-0 h-3 bg-[#FFC107] opacity-30 -z-10"></span>
                </span>
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                in
                <span className="relative inline-block mx-2">
                  one place
                  <span className="absolute bottom-1 left-0 right-0 h-1 border-b-2 border-[#3D56A6]"></span>
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-lg">
              Simple to use, powerful for your team, built for modern manufacturing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-[#3D56A6] text-white hover:bg-[#2D4485]">
                Get started now — it's free!
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#3D56A6] text-[#3D56A6] hover:bg-[#3D56A6] hover:text-white bg-transparent"
              >
                Book a demo
              </Button>
            </div>
          </div>

          {/* Right Side - Price Tag */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              {/* Decorative price tag */}
              <div className="bg-white border-2 border-[#3D56A6] rounded-lg p-6 shadow-lg transform rotate-3">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold">Pricing</p>
                  <p className="text-3xl font-bold text-[#3D56A6]">US$ 13.50</p>
                  <p className="text-sm text-muted-foreground">per user — unlimited ERP apps</p>
                </div>
                {/* Arrow decoration */}
                <div className="absolute -top-6 -right-4 text-[#3D56A6] text-2xl">↗</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
