import React from 'react';
import { create } from 'zustand';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryVoronoiContainer,
  VictoryLabel,
  VictoryPie,
  VictoryContainer,
  VictoryTheme
} from 'victory';

// Zustand Store
const useHealthStore = create((set) => ({
  healthData: {
    bowelMovements: [
      { date: '2024-01-10', count: 4, pain: 3 },
      { date: '2024-01-11', count: 3, pain: 2 },
      { date: '2024-01-12', count: 5, pain: 4 },
      { date: '2024-01-13', count: 2, pain: 1 },
      { date: '2024-01-14', count: 3, pain: 2 },
      { date: '2024-01-15', count: 4, pain: 3 },
      { date: '2024-01-16', count: 3, pain: 2 }
    ],
    sleepQuality: [
      { date: '2024-01-10', hours: 7, quality: 4 },
      { date: '2024-01-11', hours: 6, quality: 3 },
      { date: '2024-01-12', hours: 8, quality: 5 },
      { date: '2024-01-13', hours: 7, quality: 4 },
      { date: '2024-01-14', hours: 6, quality: 3 },
      { date: '2024-01-15', hours: 7, quality: 4 },
      { date: '2024-01-16', hours: 8, quality: 5 }
    ],
    stressLevels: [
      { date: '2024-01-10', level: 5 },
      { date: '2024-01-11', level: 6 },
      { date: '2024-01-12', level: 4 },
      { date: '2024-01-13', level: 3 },
      { date: '2024-01-14', level: 5 },
      { date: '2024-01-15', level: 4 },
      { date: '2024-01-16', level: 3 }
    ],
    symptoms: {
      pain: 30,
      fatigue: 25,
      bloating: 20,
      other: 25
    }
  }
}));

const HealthMetricCard = ({ title, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const BowelMovementChart = ({ data }) => (
  <VictoryChart
    theme={VictoryTheme.material}
    height={200}
    containerComponent={
      <VictoryVoronoiContainer
        labels={({ datum }) => `Count: ${datum.count}\nPain: ${datum.pain}`}
      />
    }
  >
    <VictoryAxis
      tickFormat={(x) => new Date(x).toLocaleDateString()}
      style={{ tickLabels: { angle: -45, fontSize: 8 } }}
    />
    <VictoryAxis dependentAxis />
    <VictoryLine
      style={{ data: { stroke: "#2196f3" } }}
      data={data}
      x="date"
      y="count"
    />
    <VictoryLine
      style={{ data: { stroke: "#f44336" } }}
      data={data}
      x="date"
      y="pain"
    />
  </VictoryChart>
);

const SleepQualityChart = ({ data }) => (
  <VictoryChart
    theme={VictoryTheme.material}
    height={200}
    containerComponent={
      <VictoryVoronoiContainer
        labels={({ datum }) => `Hours: ${datum.hours}\nQuality: ${datum.quality}`}
      />
    }
  >
    <VictoryAxis
      tickFormat={(x) => new Date(x).toLocaleDateString()}
      style={{ tickLabels: { angle: -45, fontSize: 8 } }}
    />
    <VictoryAxis dependentAxis />
    <VictoryLine
      style={{ data: { stroke: "#4caf50" } }}
      data={data}
      x="date"
      y="hours"
    />
  </VictoryChart>
);

const SymptomDistribution = ({ data }) => (
  <VictoryPie
    data={[
      { x: "Pain", y: data.pain },
      { x: "Fatigue", y: data.fatigue },
      { x: "Bloating", y: data.bloating },
      { x: "Other", y: data.other }
    ]}
    colorScale={["#f44336", "#2196f3", "#4caf50", "#ff9800"]}
    height={200}
    labels={({ datum }) => `${datum.x}\n${datum.y}%`}
    style={{ labels: { fontSize: 8 } }}
  />
);

const HealthDashboard = () => {
  const healthData = useHealthStore((state) => state.healthData);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        (placeholder) - Health Summary Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <HealthMetricCard title="Bowel Movements & Pain Trends">
            <BowelMovementChart data={healthData.bowelMovements} />
          </HealthMetricCard>
        </Grid>
        {/* <Grid item xs={12} md={6}>
          <HealthMetricCard title="Sleep Quality Trends">
            <SleepQualityChart data={healthData.sleepQuality} />
          </HealthMetricCard>
        </Grid> */}
        <Grid item xs={12} md={6}>
          <HealthMetricCard title="Symptom Distribution">
            <SymptomDistribution data={healthData.symptoms} />
          </HealthMetricCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HealthDashboard;