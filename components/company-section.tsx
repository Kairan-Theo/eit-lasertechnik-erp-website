"use client"

const benefits = [
  {
    title: "Real-time Data",
    description: "Access live insights across all operations",
    icon: "⚡",
  },
  {
    title: "Integrated Operations",
    description: "Seamlessly connected departments and workflows",
    icon: "🔗",
  },
  {
    title: "Cost Savings",
    description: "Reduce operational overhead by up to 40%",
    icon: "💰",
  },
  {
    title: "Fast Deployment",
    description: "Live in days, not months",
    icon: "🚀",
  },
]

export default function CompanySection() {
  return (
    <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by precision manufacturing teams globally.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            EIT Lasertechnik specializes in laser technology and manufacturing solutions. Our ERP system is designed
            specifically for industrial workflows, helping teams manage complex operations with precision and
            efficiency.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center text-center">
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
