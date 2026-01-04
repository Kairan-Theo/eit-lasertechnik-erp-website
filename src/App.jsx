import Navigation from "./components/navigation.jsx"
import HeroSection from "./components/hero-section.jsx"
import CompanySection from "./components/company-section.jsx"
import Footer from "./components/footer.jsx"
import { Toaster } from "../components/ui/toaster"

export default function App() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <CompanySection />
      <Footer />
      <Toaster />
    </main>
  )
}
