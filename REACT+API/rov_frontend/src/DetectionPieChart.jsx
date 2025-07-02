import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6699', '#FF4444', '#44FF44', '#4444FF', '#FFD700'
];

export default function DetectionPieChart({ data, includedTypes, onToggleType }) {
  // data: [{ type: 'person', count: 5 }, ...]
  // includedTypes: Set of types to include
  // onToggleType: function(type)

  const filteredData = data.filter(d => includedTypes.has(d.type));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Detected Object Types</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
        {data.map((d, idx) => (
          <FormControlLabel
            key={d.type}
            control={
              <Checkbox
                checked={includedTypes.has(d.type)}
                onChange={() => onToggleType(d.type)}
                sx={{ color: COLORS[idx % COLORS.length] }}
              />
            }
            label={d.type}
          />
        ))}
      </Box>
      <Box sx={{ width: '100%', minWidth: 300, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {filteredData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
} 