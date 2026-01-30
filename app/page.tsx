import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import BookingSteps from "@/components/home/BookingSteps";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      {/* Navigation Bar */}
      <Navbar />

      {/* ส่วนหัวของเว็บ: ทักทายและค้นหา */}
      <HeroSection />

      {/* ส่วนแสดงผังตลาดจำลอง (ไฮไลท์ที่ว่าง) */}

      {/* ส่วนอธิบายขั้นตอนการจอง */}
      <BookingSteps />

      {/* Footer */}
      <Footer />
    </main>
  );
}