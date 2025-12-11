import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import AppGrid from "@/components/app-grid"
import CompanySection from "@/components/company-section"
import CTABanner from "@/components/cta-banner"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <AppGrid />
      <CompanySection />
      <CTABanner />
      <Footer />
    </main>
  )
}
