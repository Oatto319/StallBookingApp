import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import MarketMapPreview from "@/components/home/MarketMapPreview";
import BookingSteps from "@/components/home/BookingSteps";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <Navbar />

      {/* ส่วนหัวของเว็บ: ทักทายและค้นหา */}
      <HeroSection />

      {/* ส่วนแสดงผังตลาดจำลอง (ไฮไลท์ที่ว่าง) */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          เลือกทำเลขายของวันนี้
        </h2>
        <MarketMapPreview />
      </div>

      {/* ส่วนอธิบายขั้นตอนการจอง */}
      <BookingSteps />

      {/* Footer */}
      <Footer />
    </main>
  );
}