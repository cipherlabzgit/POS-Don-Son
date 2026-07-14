import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
}: MetricCardProps) {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <p className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium ${changeColors[changeType]} truncate`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} rounded-lg p-2 sm:p-3 flex-shrink-0 ml-2`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
