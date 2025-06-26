import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Mon", new: 5, success: 2 },
  { name: "Tue", new: 8, success: 4 },
  { name: "Wed", new: 6, success: 5 },
  { name: "Thu", new: 9, success: 6 },
  { name: "Fri", new: 7, success: 5 },
];

const Newscustomerchart = () => {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={5}>
          <defs>
            <pattern
              id="linePattern"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
            >
              <path d="M0,0 L6,6" stroke="#0d6efd" strokeWidth="1" />
            </pattern>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="success"
            fill="url(#linePattern)"
            radius={[4, 4, 0, 0]}
            name="Success"
          />
          <Bar
            dataKey="new"
            fill="#0d6efd"
            radius={[4, 4, 0, 0]}
            name="New"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Newscustomerchart;
