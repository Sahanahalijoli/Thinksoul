import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import About from '@/components/landing/About'
import Features from '@/components/landing/Features'
import Creative from '@/components/landing/Creative'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Creative />
      <Footer />
    </main>
  )
}
