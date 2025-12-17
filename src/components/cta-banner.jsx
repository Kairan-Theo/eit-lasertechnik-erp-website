export default function CTABanner() {
  return (
    <section className="w-full bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Internal system — for EIT Lasertechnik use only.
        </h2>
        <div className="flex gap-3">
          <a href="/apps.html" className="btn-primary">Open modules</a>
          <a href="mailto:it-support@eit.local" className="btn-outline">Contact support</a>
        </div>
      </div>    
    </section>
  )
}
