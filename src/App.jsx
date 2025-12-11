import Navigation from "./components/navigation.jsx"
import HeroSection from "./components/hero-section.jsx"
import AppGrid from "./components/app-grid.jsx"
import CompanySection from "./components/company-section.jsx"
import CTABanner from "./components/cta-banner.jsx"
import Footer from "./components/footer.jsx"

export default function App() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <AppGrid />
      <CompanySection />
      <CTABanner />
      <Footer />
    </main>
  )
}
