import { FileText, Users, Pill, FileSearch } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';


interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const cards = [
    {
      title: 'New Case',
      description: 'Register a new patient case',
      icon: FileText,
      action: () => onNavigate('new-case'),
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Follow Up',
      description: 'View and manage patient follow-ups',
      icon: Users,
      action: () => onNavigate('follow-up'),
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Medicines Bunch',
      description: 'Browse all available medicines',
      icon: Pill,
      action: () => onNavigate('medicines-bunch'),
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'Medicine Details',
      description: 'View detailed medicine information',
      icon: FileSearch,
      action: () => onNavigate('medicines'),
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      title: 'Patient History',
      description: 'Search, view, and manage all patient records',
      icon: Users, // or History icon
      action: () => onNavigate('patient-history'),
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Medical Case Management</h1>
          <p className="text-slate-600 mt-1">
            Comprehensive patient care and medicine tracking system
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={card.action}
                className="group cursor-pointer"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 ${card.color} ${card.hoverColor} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-slate-900">{card.title}</CardTitle>
                    <CardDescription className="text-slate-600">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className={`w-full ${card.color} ${card.hoverColor} text-white border-0 shadow-sm`}
                    >
                      Open Module
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}