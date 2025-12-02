}

const SentimentGraph: React.FC<SentimentGraphProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
      <div className="flex justify-between items-end mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Sentiment Wave
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">Emotional tone analysis</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-purple-600">Positive</span>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Dominant Tone</p>
        </div>
      </div>

      <div className="h-[220px] w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
              interval="preserveStartEnd"
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#1f2937',
                fontSize: '12px',
                fontWeight: 500
              }}
              itemStyle={{ color: '#7c3aed' }}
              cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '4 4' }}
            />
            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSentiment)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentGraph;
