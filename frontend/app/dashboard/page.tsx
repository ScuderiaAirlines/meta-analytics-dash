"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Target, MousePointerClick, Percent } from "lucide-react"

interface MetricData {
  totalSpend: number
  totalConversions: number
  avgCTR: number
  avgROAS: number
  prevSpend: number
  prevConversions: number
  prevCTR: number
  prevROAS: number
}

interface ChartData {
  date: string
  spend: number
  conversions: number
}

interface CampaignPerformance {
  name: string
  spend: number
  conversions: number
  roas: number
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get metrics for last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const metricsData = await apiClient.getMetrics({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })

      // Calculate totals and averages
      const totalSpend = metricsData.reduce((sum: number, m: any) => sum + m.spend, 0)
      const totalConversions = metricsData.reduce((sum: number, m: any) => sum + m.conversions, 0)
      const avgCTR = metricsData.length > 0
        ? metricsData.reduce((sum: number, m: any) => sum + m.ctr, 0) / metricsData.length
        : 0
      const avgROAS = metricsData.length > 0
        ? metricsData.reduce((sum: number, m: any) => sum + m.roas, 0) / metricsData.length
        : 0

      // Calculate previous period (for comparison)
      const prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - 30)
      const prevEndDate = new Date(startDate)

      const prevMetricsData = await apiClient.getMetrics({
        startDate: prevStartDate.toISOString().split('T')[0],
        endDate: prevEndDate.toISOString().split('T')[0],
      })

      const prevSpend = prevMetricsData.reduce((sum: number, m: any) => sum + m.spend, 0)
      const prevConversions = prevMetricsData.reduce((sum: number, m: any) => sum + m.conversions, 0)
      const prevCTR = prevMetricsData.length > 0
        ? prevMetricsData.reduce((sum: number, m: any) => sum + m.ctr, 0) / prevMetricsData.length
        : 0
      const prevROAS = prevMetricsData.length > 0
        ? prevMetricsData.reduce((sum: number, m: any) => sum + m.roas, 0) / prevMetricsData.length
        : 0

      setMetrics({
        totalSpend,
        totalConversions,
        avgCTR,
        avgROAS,
        prevSpend,
        prevConversions,
        prevCTR,
        prevROAS,
      })

      // Prepare chart data (group by date)
      const dateMap = new Map<string, { spend: number; conversions: number }>()
      metricsData.forEach((m: any) => {
        const date = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = dateMap.get(date) || { spend: 0, conversions: 0 }
        dateMap.set(date, {
          spend: existing.spend + m.spend,
          conversions: existing.conversions + m.conversions,
        })
      })

      const chartDataArray = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14) // Last 14 days

      setChartData(chartDataArray)

      // Get campaign performance
      const campaignsData = await apiClient.getCampaigns()
      const campaignMetrics = await Promise.all(
        campaignsData.slice(0, 5).map(async (campaign: any) => {
          const metrics = await apiClient.getMetrics({
            entityType: 'campaign',
            entityId: campaign.campaignId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          })

          const spend = metrics.reduce((sum: number, m: any) => sum + m.spend, 0)
          const conversions = metrics.reduce((sum: number, m: any) => sum + m.conversions, 0)
          const roas = metrics.length > 0
            ? metrics.reduce((sum: number, m: any) => sum + m.roas, 0) / metrics.length
            : 0

          return {
            name: campaign.name,
            spend,
            conversions,
            roas,
          }
        })
      )

      setCampaigns(campaignMetrics.sort((a, b) => b.spend - a.spend))

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Last 30 days performance overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Spend */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics?.totalSpend || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {calculateChange(metrics?.totalSpend || 0, metrics?.prevSpend || 0) > 0 ? (
                  <><TrendingUp className="h-3 w-3 text-emerald-500" /> +{formatPercent(calculateChange(metrics?.totalSpend || 0, metrics?.prevSpend || 0))}</>
                ) : (
                  <><TrendingDown className="h-3 w-3 text-red-500" /> {formatPercent(calculateChange(metrics?.totalSpend || 0, metrics?.prevSpend || 0))}</>
                )}
                {" "}vs last period
              </p>
            </CardContent>
          </Card>

          {/* Total Conversions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalConversions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {calculateChange(metrics?.totalConversions || 0, metrics?.prevConversions || 0) > 0 ? (
                  <><TrendingUp className="h-3 w-3 text-emerald-500" /> +{formatPercent(calculateChange(metrics?.totalConversions || 0, metrics?.prevConversions || 0))}</>
                ) : (
                  <><TrendingDown className="h-3 w-3 text-red-500" /> {formatPercent(calculateChange(metrics?.totalConversions || 0, metrics?.prevConversions || 0))}</>
                )}
                {" "}vs last period
              </p>
            </CardContent>
          </Card>

          {/* Average CTR */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(metrics?.avgCTR || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {calculateChange(metrics?.avgCTR || 0, metrics?.prevCTR || 0) > 0 ? (
                  <><TrendingUp className="h-3 w-3 text-emerald-500" /> +{formatPercent(calculateChange(metrics?.avgCTR || 0, metrics?.prevCTR || 0))}</>
                ) : (
                  <><TrendingDown className="h-3 w-3 text-red-500" /> {formatPercent(calculateChange(metrics?.avgCTR || 0, metrics?.prevCTR || 0))}</>
                )}
                {" "}vs last period
              </p>
            </CardContent>
          </Card>

          {/* Average ROAS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg ROAS</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgROAS.toFixed(2) || '0.00'}x</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {calculateChange(metrics?.avgROAS || 0, metrics?.prevROAS || 0) > 0 ? (
                  <><TrendingUp className="h-3 w-3 text-emerald-500" /> +{formatPercent(calculateChange(metrics?.avgROAS || 0, metrics?.prevROAS || 0))}</>
                ) : (
                  <><TrendingDown className="h-3 w-3 text-red-500" /> {formatPercent(calculateChange(metrics?.avgROAS || 0, metrics?.prevROAS || 0))}</>
                )}
                {" "}vs last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Spend Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Spend Over Time</CardTitle>
              <CardDescription>Daily spend for the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Top Campaigns</CardTitle>
              <CardDescription>By total spend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaigns}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Detailed metrics for top campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Campaign</th>
                    <th className="text-right p-3 font-medium">Spend</th>
                    <th className="text-right p-3 font-medium">Conversions</th>
                    <th className="text-right p-3 font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">{campaign.name}</td>
                      <td className="p-3 text-right">{formatCurrency(campaign.spend)}</td>
                      <td className="p-3 text-right">{campaign.conversions}</td>
                      <td className={`p-3 text-right font-medium ${
                        campaign.roas < 1 ? 'text-red-500' :
                        campaign.roas > 3 ? 'text-emerald-500' : ''
                      }`}>
                        {campaign.roas.toFixed(2)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
