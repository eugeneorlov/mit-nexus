import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Map, Coffee } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening in your cohort.</p>
      </div>

      {/* Coffee Roulette */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
            <Coffee size={18} className="text-[#F59E0B]" />
            Coffee Roulette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Get matched with a fellow cohort member for a casual chat.
          </p>
          <Button
            disabled
            className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white opacity-60 cursor-not-allowed"
          >
            Find My Match (coming soon)
          </Button>
        </CardContent>
      </Card>

      {/* Member progress */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
            <Users size={18} className="text-[#3B82F6]" />
            Cohort Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Members onboarded</span>
            <span className="font-medium text-[#1E293B]">— / —</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#10B981] rounded-full w-0 transition-all" />
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/directory">
          <Card className="border border-gray-200 hover:border-[#F59E0B] hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Users size={24} className="text-[#1E293B]" />
              <span className="text-sm font-medium text-[#1E293B]">Directory</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/map">
          <Card className="border border-gray-200 hover:border-[#F59E0B] hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Map size={24} className="text-[#1E293B]" />
              <span className="text-sm font-medium text-[#1E293B]">Map</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
