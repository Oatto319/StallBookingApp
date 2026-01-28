import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Minimap from "@/components/home/minimap";

export default function MinimapPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Minimap />
        </div>
      </div>

      <Footer />
    </main>
  );
}