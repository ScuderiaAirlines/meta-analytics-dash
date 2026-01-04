"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api"
import { TrendingUp, TrendingDown, DollarSign, Target, MousePointerClick, Percent, AlertCircle } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Date range presets
const getDateRange = (preset: string) => {
  const end = new Date()
  const start = new Date()

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'last7':
      start.setDate(start.getDate() - 7)
      break
    case 'last30':
      start.setDate(start.getDate() - 30)
      break
    default:
      start.setDate(start.getDate() - 7)
  }

  return { start, end }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value)
}

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)
  const [budgetPacing, setBudgetPacing] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [funnel, setFunnel] = useState<any>(null)
  const [topCreatives, setTopCreatives] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [datePreset, setDatePreset] = useState('last7')

  useEffect(() => {
    loadDashboardData()
  }, [datePreset])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange(datePreset)

      // Calculate previous period
      const periodLength = end.getTime() - start.getTime()
      const previousEnd = new Date(start.getTime() - 1)
      const previousStart = new Date(previousEnd.getTime() - periodLength)

      const startDate = start.toISOString().split('T')[0]
      const endDate = end.toISOString().split('T')[0]
      const previousStartDate = previousStart.toISOString().split('T')[0]
      const previousEndDate = previousEnd.toISOString().split('T')[0]

      const [overviewData, budgetData, campaignsData, trendsData, funnelData, creativesData, anomaliesData] = await Promise.all([
        apiClient.getOverview({ startDate, endDate, previousStart: previousStartDate, previousEnd: previousEndDate }),
        apiClient.getBudgetPacing({ startDate, endDate }),
        apiClient.getAnalyticsCampaigns({ startDate, endDate }),
        apiClient.getTrends({ startDate, endDate }),
        apiClient.getFunnel({ startDate, endDate }),
        apiClient.getTopCreatives({ startDate, endDate, limit: 4 }),
        apiClient.getAnomalies({ resolved: false, limit: 3 }),
      ])

      setOverview(overviewData)
      setBudgetPacing(budgetData)
      setCampaigns(campaignsData)
      setTrends(trendsData)
      setFunnel(funnelData)
      setTopCreatives(creativesData)
      setAnomalies(anomaliesData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoasColor = (roas: number) => {
    if (roas >= 5) return 'bg-emerald-500'
    if (roas >= 3) return 'bg-green-500'
    if (roas >= 1) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive" className="rounded-full">🔴 HIGH</Badge>
      case 'medium':
        return <Badge variant="warning" className="rounded-full">🟡 MEDIUM</Badge>
      case 'low':
        return <Badge variant="secondary" className="rounded-full">🟢 LOW</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Date Filter */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Meta Ads Performance Analytics</p>
          </div>
          <div className="flex gap-2">
            {['today', 'yesterday', 'last7', 'last30'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  datePreset === preset
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'yesterday' && 'Yesterday'}
                {preset === 'last7' && 'Last 7 Days'}
                {preset === 'last30' && 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Performance Overview - 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spend */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {formatCurrency(overview?.current?.totalSpend || 0)}
              </div>
              {overview?.delta && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  overview.delta.spend >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {overview.delta.spend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(overview.delta.spend * 100)} vs prev period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversions */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Conversions</CardTitle>
                <Target className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {formatNumber(overview?.current?.totalConversions || 0)}
              </div>
              {overview?.delta && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  overview.delta.conversions >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {overview.delta.conversions >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(overview.delta.conversions * 100)} vs prev period
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">ROAS</CardTitle>
                <Percent className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {(overview?.current?.avgROAS || 0).toFixed(2)}x
              </div>
              {overview?.delta && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  overview.delta.roas >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {overview.delta.roas >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(overview.delta.roas * 100)} vs prev period
                </div>
              )}
            </CardContent>
          </Card>

          {/* CPM */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">CPM</CardTitle>
                <MousePointerClick className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {formatCurrency(overview?.current?.avgCPM || 0)}
              </div>
              {overview?.delta && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                  overview.delta.cpm <= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {overview.delta.cpm <= 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {formatPercent(overview.delta.cpm * 100)} vs prev period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Pacing + Anomalies Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Pacing */}
          <Card className="bg-white rounded-2xl shadow-sm border-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Budget Pacing</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Spend vs time elapsed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Spend</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(budgetPacing?.spent || 0)} / {formatCurrency(budgetPacing?.totalBudget || 0)}
                  </span>
                </div>
                <Progress value={budgetPacing?.spentPercent || 0} className="h-2" />
                <div className="text-right text-xs text-slate-500">
                  {(budgetPacing?.spentPercent || 0).toFixed(1)}% spent
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Time Elapsed</span>
                  <span className="font-semibold text-slate-900">
                    {budgetPacing?.daysRemaining || 0} days remaining
                  </span>
                </div>
                <Progress value={budgetPacing?.timeElapsed || 0} className="h-2" />
                <div className="text-right text-xs text-slate-500">
                  {(budgetPacing?.timeElapsed || 0).toFixed(1)}% elapsed
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Pacing Status</div>
                    <div className={`text-sm font-semibold ${
                      budgetPacing?.pacingStatus === 'on-track'
                        ? 'text-emerald-600'
                        : budgetPacing?.pacingStatus === 'ahead'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {budgetPacing?.pacingStatus === 'on-track' && '✓ On Track'}
                      {budgetPacing?.pacingStatus === 'ahead' && '⚠️ Pacing Ahead'}
                      {budgetPacing?.pacingStatus === 'behind' && '⬇️ Pacing Behind'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Projected</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatCurrency(budgetPacing?.projected || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies Feed */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Performance Alerts</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                High severity anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies && anomalies.length > 0 ? (
                  anomalies.map((anomaly: any) => (
                    <div key={anomaly.id} className="space-y-1">
                      {getSeverityBadge(anomaly.severity)}
                      <div className="text-sm font-medium text-slate-900 line-clamp-2">
                        {anomaly.metricName} on {anomaly.entityType}
                      </div>
                      <div className="text-xs text-slate-500">
                        Expected: {anomaly.expectedValue.toFixed(2)} → Actual: {anomaly.actualValue.toFixed(2)}
                        <span className="font-semibold text-red-600 ml-1">
                          ({anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent.toFixed(0)}%)
                        </span>
                      </div>
                      {anomaly !== anomalies[anomalies.length - 1] && (
                        <div className="border-b border-slate-100 pt-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No anomalies detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Chart + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <Card className="bg-white rounded-2xl shadow-sm border-none lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Performance Trends</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daily spend and conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any) => ['$' + value.toFixed(2)]}
                  />
                  <Line type="monotone" dataKey="spend" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funnel Metrics */}
          <Card className="bg-white rounded-2xl shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Conversion Funnel</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Impressions to conversions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Impressions</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(funnel?.impressions || 0)}
                  </span>
                </div>
                <div className="h-8 bg-slate-200 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Clicks</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(funnel?.clicks || 0)}
                  </span>
                </div>
                <div className="h-8 bg-sky-200 rounded-full" style={{ width: '60%' }} />
                <div className="text-xs text-slate-500">
                  CTR: {(funnel?.ctr || 0).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Conversions</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(funnel?.conversions || 0)}
                  </span>
                </div>
                <div className="h-8 bg-emerald-500 rounded-full" style={{ width: '30%' }} />
                <div className="text-xs text-slate-500">
                  CVR: {(funnel?.cvr || 0).toFixed(2)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card className="bg-white rounded-2xl shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Campaign Performance</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Top campaigns by spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-600 pb-3">Campaign</th>
                    <th className="text-right text-xs font-medium text-slate-600 pb-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-600 pb-3">Spend</th>
                    <th className="text-right text-xs font-medium text-slate-600 pb-3">Conv.</th>
                    <th className="text-right text-xs font-medium text-slate-600 pb-3">ROAS</th>
                    <th className="text-right text-xs font-medium text-slate-600 pb-3">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 10).map((campaign, index) => (
                    <tr key={campaign.campaignId} className="border-b border-slate-100">
                      <td className="py-3 text-sm font-medium text-slate-900">{campaign.name}</td>
                      <td className="py-3 text-right">
                        <Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-xs">
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-sm text-slate-900">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="py-3 text-right text-sm text-slate-900">
                        {formatNumber(campaign.conversions)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`w-2 h-2 rounded-full ${getRoasColor(campaign.roas)}`} />
                          <span className="text-sm font-semibold text-slate-900">
                            {campaign.roas.toFixed(2)}x
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm text-slate-900">
                        {campaign.ctr.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Creatives */}
        <Card className="bg-white rounded-2xl shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Top Performing Creatives</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Best ads by conversions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topCreatives.map((creative) => (
                <div key={creative.adId} className="space-y-2">
                  {creative.thumbnailUrl ? (
                    <img
                      src={creative.thumbnailUrl}
                      alt={creative.name}
                      className="w-full aspect-square object-cover rounded-lg bg-slate-100"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400 text-sm">No image</span>
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-900 line-clamp-1">{creative.name}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{formatNumber(creative.conversions)} conv</span>
                    <Badge variant={creative.roas >= 3 ? 'success' : 'secondary'} className="text-xs">
                      {creative.roas.toFixed(1)}x ROAS
                    </Badge>
                  </div>
                  {creative.aiScore && (
                    <div className="text-xs text-slate-500">
                      AI Score: {creative.aiScore.toFixed(1)}/10
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
