import { BarChart3, Workflow, ShieldCheck, Clock } from "lucide-react"
 
const benefits = [
  {
    title: "Real‑time visibility",
    description: "Live operational metrics across production, inventory and sales",
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Integrated workflows",
    description: "Connected processes from quotation to delivery",
    icon: Workflow,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Security first",
    description: "Role-based access and audit-friendly activity logs",
    icon: ShieldCheck,
    color: "text-slate-700",
    bg: "bg-slate-50",
  },
  {
    title: "Responsive operations",
    description: "Fast updates and alerts for time-critical tasks",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
]

export default function CompanySection() {
  return (
    <section className="w-full bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-left mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Core capabilities</h2>
          <p className="text-gray-600 mt-2 max-w-3xl">
            Purpose-built for a single organization. Focused on operational excellence and consistency across teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className={`p-3 rounded-lg ${benefit.bg} ${benefit.color}`}>
                <benefit.icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
