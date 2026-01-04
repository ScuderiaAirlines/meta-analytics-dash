"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { Lightbulb, TrendingUp, Target, Sparkles, RefreshCw } from "lucide-react"

interface InsightsData {
  period: {
    days: number
    start: string
    end: string
  }
  metrics: {
    totalSpend: number
    totalConversions: number
    avgCPC: number
    avgCTR: number
    avgROAS: number
  }
  topCampaigns: Array<{
    name: string
    spend: number
    conversions: number
  }>
  insights: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
    opportunities: string[]
  }
}

export default function InsightsPage() {
  const [insights7, setInsights7] = useState<InsightsData | null>(null)
  const [insights30, setInsights30] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("7")

  const loadInsights = async (days: number) => {
    try {
      setLoading(true)
      const data = await apiClient.getInsights(days)
      if (days === 7) {
        setInsights7(data)
      } else {
        setInsights30(data)
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentInsights = activeTab === "7" ? insights7 : insights30

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground">Strategic recommendations powered by AI</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="7" className="space-y-6 mt-6">
            {!insights7 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Generate Insights</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Click the button below to generate AI-powered insights for the last 7 days
                  </p>
                  <Button onClick={() => loadInsights(7)} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <InsightsDisplay data={insights7} onRegenerate={() => loadInsights(7)} loading={loading} />
            )}
          </TabsContent>

          <TabsContent value="30" className="space-y-6 mt-6">
            {!insights30 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Generate Insights</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Click the button below to generate AI-powered insights for the last 30 days
                  </p>
                  <Button onClick={() => loadInsights(30)} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <InsightsDisplay data={insights30} onRegenerate={() => loadInsights(30)} loading={loading} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function InsightsDisplay({
  data,
  onRegenerate,
  loading
}: {
  data: InsightsData
  onRegenerate: () => void
  loading: boolean
}) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              {data.period.start} to {data.period.end}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold">{formatCurrency(data.metrics.totalSpend)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{data.metrics.totalConversions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg CPC</p>
              <p className="text-2xl font-bold">{formatCurrency(data.metrics.avgCPC)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg CTR</p>
              <p className="text-2xl font-bold">{data.metrics.avgCTR.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg ROAS</p>
              <p className="text-2xl font-bold">{data.metrics.avgROAS.toFixed(2)}x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {data.insights.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Key Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.insights.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{finding}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Recommendations
          </CardTitle>
          <CardDescription>Actionable steps to improve performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{rec}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Growth Opportunities
          </CardTitle>
          <CardDescription>Potential areas for expansion</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.insights.opportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{opp}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
          <CardDescription>By total spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topCampaigns.map((campaign, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.conversions} conversions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(campaign.spend)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
