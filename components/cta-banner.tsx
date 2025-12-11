import { Button } from "@/components/ui/button"

export default function CTABanner() {
  return (
    <section className="w-full bg-[#E3F2FD] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Start managing your manufacturing smarter — Try EIT ERP today.
          </h2>
        </div>
        <Button className="bg-[#3D56A6] text-white hover:bg-[#2D4485] whitespace-nowrap">Begin Free Trial</Button>
      </div>
    </section>
  )
}
