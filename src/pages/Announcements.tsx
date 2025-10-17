import { Navbar } from "@/components/Navbar";

const Announcements = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Announcements</h2>
        <p className="text-muted-foreground">Course-wide announcements will appear here.</p>
      </main>
    </div>
  );
};

export default Announcements;
