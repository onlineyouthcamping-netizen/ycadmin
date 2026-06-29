import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

const DashboardChart = memo(function DashboardChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          fontSize={10} 
          fontWeight="500" 
          tick={{fill: '#94A3B8'}} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          fontSize={10} 
          fontWeight="500" 
          tick={{fill: '#94A3B8'}}
          dx={-10}
        />
        <Tooltip 
          cursor={{fill: '#F8FAFC'}} 
          contentStyle={{ 
            borderRadius: '16px', 
            border: '1px solid #E2E8F0', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            padding: '12px 16px'
          }} 
        />
        <Bar dataKey="revenue" fill="#FF5400" radius={[12, 12, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export default DashboardChart;
