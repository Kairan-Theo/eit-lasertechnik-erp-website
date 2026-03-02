export default function HeroSection() {
  return (
    <section className="w-full bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              EIT Lasertechnik ERP
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Unified, secure operations for a single organization. Built for precision manufacturing and
              streamlined internal workflows.
            </p>
          </div>
 
          {/* UI removed per request: hide bottom action buttons (Open modules, Admin panel) */}
        </div>
      </div>
    </section>
  )
}
