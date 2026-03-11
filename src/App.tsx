import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function App() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#1E293B] text-2xl">MIT Nexus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Cohort connection platform</p>
          <div className="flex gap-2">
            <Badge className="bg-[#10B981] text-white">Help</Badge>
            <Badge className="bg-[#3B82F6] text-white">Learn</Badge>
            <Badge className="bg-[#F59E0B] text-white">Amber</Badge>
          </div>
          <Button className="w-full bg-[#1E293B] hover:bg-[#1E293B]/90">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
