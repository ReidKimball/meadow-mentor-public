import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend, Area } from 'recharts';

const UserGrowthChart = () => {
    const data = [
        { week: 'Mar 2-8', newUsers: 2, totalUsers: 2 },
        { week: 'Mar 9-15', newUsers: 4, totalUsers: 6 },
        { week: 'Mar 16-22', newUsers: 2, totalUsers: 8 },
        { week: 'Mar 23-29', newUsers: 2, totalUsers: 10 },
        { week: 'Mar 30-Apr 5', newUsers: 3, totalUsers: 13 },
    ];

    return (
        <div className="flex flex-col items-center w-full p-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Meadow Mentor User Growth</h1>

            <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-sm">
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="week"
                            tick={{ fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            tick={{ fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            label={{ value: 'New Users', angle: -90, position: 'insideLeft', fill: '#6b7280', dx: -10 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 'dataMax + 2']}
                            tick={{ fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            label={{ value: 'Total Users', angle: -90, position: 'insideRight', fill: '#6b7280', dx: 10 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                padding: '10px'
                            }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={40}
                            wrapperStyle={{ paddingTop: '10px' }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="newUsers"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            name="New Users"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="totalUsers"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ stroke: '#2563eb', strokeWidth: 2, r: 6, fill: 'white' }}
                            activeDot={{ stroke: '#2563eb', strokeWidth: 2, r: 8, fill: 'white' }}
                            name="Total Users"


                        />
                        <Area
                            yAxisId="right"
                            dataKey="totalUsers"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                            stroke="none"
                            name=' '
                            legendType='none'
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm w-full max-w-4xl">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-lg">
                        <p className="text-gray-600 text-sm mb-1">New Users (This Week)</p>
                        <p className="text-3xl font-bold text-indigo-600">{data[4].newUsers}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-gray-600 text-sm mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-blue-600">{data[4].totalUsers}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGrowthChart;