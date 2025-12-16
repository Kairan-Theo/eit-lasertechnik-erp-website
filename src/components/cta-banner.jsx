export default function CTABanner() {
  return (
    <section className="w-full bg-[#E3F2FD] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Start managing your manufacturing smarter — Try EIT ERP today.
          </h2>
        </div>
        <a href="/signup.html" className="btn-primary whitespace-nowrap">
          Sign up
        </a>
      </div>
    </section>
  )
}
