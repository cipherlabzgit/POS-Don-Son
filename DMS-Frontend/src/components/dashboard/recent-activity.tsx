import { ShoppingBag, Truck, Package, UserCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'delivery' | 'product' | 'customer';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order #1234',
    description: 'John Doe placed an order for $145.00',
    time: '5 minutes ago',
  },
  {
    id: '2',
    type: 'delivery',
    title: 'Delivery Completed',
    description: 'Order #1230 delivered to Jane Smith',
    time: '15 minutes ago',
  },
  {
    id: '3',
    type: 'product',
    title: 'Low Stock Alert',
    description: 'White Bread is running low (5 items left)',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'customer',
    title: 'New Customer',
    description: 'Sarah Johnson registered as a new customer',
    time: '2 hours ago',
  },
];

const iconMap = {
  order: { icon: ShoppingBag, bg: 'bg-blue-100', color: 'text-blue-600' },
  delivery: { icon: Truck, bg: 'bg-green-100', color: 'text-green-600' },
  product: { icon: Package, bg: 'bg-orange-100', color: 'text-orange-600' },
  customer: { icon: UserCircle, bg: 'bg-purple-100', color: 'text-purple-600' },
};

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-200">
        {activities.map((activity) => {
          const { icon: Icon, bg, color } = iconMap[activity.type];
          return (
            <div key={activity.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`${bg} rounded-lg p-2 flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200">
        <button className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700">
          View all activity →
        </button>
      </div>
    </div>
  );
}
