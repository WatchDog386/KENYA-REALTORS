import React from 'react';
import { DollarSign, Home, Users, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600">{title}</p>
    </div>
  );
};

const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      change: 20.1,
      icon: <DollarSign size={24} className="text-white" />,
      color: 'bg-green-500',
    },
    {
      title: 'Properties',
      value: '24',
      change: 12.5,
      icon: <Home size={24} className="text-white" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Tenants',
      value: '18',
      change: 5.2,
      icon: <Users size={24} className="text-white" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Occupancy Rate',
      value: '92%',
      change: 3.1,
      icon: <TrendingUp size={24} className="text-white" />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;