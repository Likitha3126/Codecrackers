import { Navbar } from "@/components/Navbar";

const Grades = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Grades</h2>
        <p className="text-muted-foreground">View grades for your courses here.</p>
      </main>
    </div>
  );
};

export default Grades;
