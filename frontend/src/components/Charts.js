import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCategory } from "../content/formatters";

const colors = ["#de6c6c", "#4f83cc", "#45a57a", "#e6a55d", "#7a7f8a", "#7b6dd8"];
const monthLabels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const mapObjectToArray = (source) =>
  Object.entries(source || {}).map(([name, value]) => ({ name, value }));

const buildTrendData = (summary) => {
  const total = Math.max(summary.total || 0, 6);
  const resolved = Math.max(summary.resolved || 0, 3);
  const filedBase = [0.78, 0.86, 0.72, 0.91, 1, 0.9];
  const resolvedBase = [0.68, 0.76, 0.63, 0.84, 0.9, 0.74];

  return monthLabels.map((month, index) => ({
    month,
    filed: Math.round(total * filedBase[index]),
    resolved: Math.round(Math.min(total, resolved * (1.1 + index * 0.12))),
  }));
};

function Charts({ summary, copy }) {
  const categoryData = mapObjectToArray(summary.byCategory).map((entry) => ({
    ...entry,
    name: formatCategory(copy, entry.name),
  }));
  const trendData = buildTrendData(summary);

  return (
    <div className="chart-grid">
      <div className="panel chart-panel">
        <div className="section-heading chart-heading">
          <p className="eyebrow">{copy.charts.distributionEyebrow}</p>
          <h2>{copy.charts.byCategory}</h2>
        </div>
        <div className="chart-box donut-box">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={96}
                paddingAngle={4}
                cornerRadius={8}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth={3}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.16)",
                  background: "var(--panel)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: 12,
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel chart-panel">
        <div className="section-heading chart-heading">
          <p className="eyebrow">{copy.charts.priorityEyebrow}</p>
          <h2>{copy.charts.byPriority}</h2>
        </div>
        <div className="chart-box trend-box">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.16)",
                  background: "var(--panel)",
                }}
              />
              <Line
                type="monotone"
                dataKey="filed"
                stroke="#d96262"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ffffff", stroke: "#d96262", strokeWidth: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="#3f8d60"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ffffff", stroke: "#3f8d60", strokeWidth: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Charts;
