"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"

interface Ad {
  id: string
  adId: string
  name: string
  status: string
  thumbnailUrl?: string
}

interface CreativeAnalysis {
  id: string
  adId: string
  imageUrl: string
  aiAnalysis: {
    analysis: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    predictedScore: number
  }
  predictedScore: number
  analyzedAt: string
}

export default function CreativesPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [analyses, setAnalyses] = useState<Map<string, CreativeAnalysis>>(new Map())
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  useEffect(() => {
    loadCreatives()
  }, [])

  const loadCreatives = async () => {
    try {
      setLoading(true)
      const adsData = await apiClient.getAds()
      setAds(adsData.filter((ad: Ad) => ad.thumbnailUrl)) // Only ads with images

      // Load existing analyses
      const analysesMap = new Map<string, CreativeAnalysis>()
      for (const ad of adsData) {
        try {
          const adAnalyses = await apiClient.getCreativeAnalyses(ad.adId)
          if (adAnalyses.length > 0) {
            analysesMap.set(ad.adId, adAnalyses[0]) // Get most recent
          }
        } catch (error) {
          // No analysis yet
        }
      }
      setAnalyses(analysesMap)
    } catch (error) {
      console.error('Failed to load creatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCreative = async (adId: string) => {
    try {
      setAnalyzing(adId)
      const result = await apiClient.analyzeCreative(adId)
      setAnalyses(new Map(analyses.set(adId, result.analysis)))
    } catch (error) {
      console.error('Failed to analyze creative:', error)
    } finally {
      setAnalyzing(null)
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="success" className="ml-2">Excellent</Badge>
    } else if (score >= 60) {
      return <Badge className="ml-2">Good</Badge>
    } else if (score >= 40) {
      return <Badge variant="warning" className="ml-2">Fair</Badge>
    } else {
      return <Badge variant="destructive" className="ml-2">Poor</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creative Analysis</h1>
          <p className="text-muted-foreground">AI-powered insights for your ad creatives</p>
        </div>

        {/* Creatives Grid */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading creatives...</p>
            </CardContent>
          </Card>
        ) : ads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No creatives found</p>
              <p className="text-sm text-muted-foreground">
                Sync your ads from Meta to see creatives here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => {
              const analysis = analyses.get(ad.adId)
              return (
                <Card key={ad.id} className="overflow-hidden">
                  {/* Image */}
                  {ad.thumbnailUrl && (
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={ad.thumbnailUrl}
                        alt={ad.name}
                        className="object-cover w-full h-full"
                      />
                      {analysis && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={
                              analysis.predictedScore >= 80 ? 'success' :
                              analysis.predictedScore >= 60 ? 'default' :
                              analysis.predictedScore >= 40 ? 'warning' : 'destructive'
                            }
                            className="text-lg px-3 py-1"
                          >
                            {analysis.predictedScore}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-base line-clamp-1">{ad.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{ad.status}</Badge>
                      {analysis && getScoreBadge(analysis.predictedScore)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {analysis ? (
                      <>
                        {/* Overall Analysis */}
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.aiAnalysis.analysis}
                          </p>
                        </div>

                        {/* Strengths */}
                        {analysis.aiAnalysis.strengths.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              Strengths
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {analysis.aiAnalysis.strengths.slice(0, 2).map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-emerald-500 mt-1">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {analysis.aiAnalysis.weaknesses.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              Weaknesses
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {analysis.aiAnalysis.weaknesses.slice(0, 2).map((weakness, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-1">•</span>
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        {analysis.aiAnalysis.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              Top Recommendation
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {analysis.aiAnalysis.recommendations[0]}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => analyzeCreative(ad.adId)}
                        disabled={analyzing === ad.adId}
                      >
                        {analyzing === ad.adId ? (
                          <>
                            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze Creative
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
