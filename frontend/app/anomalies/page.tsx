"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface Anomaly {
  id: string
  entityId: string
  entityType: string
  metricName: string
  expectedValue: number
  actualValue: number
  deviationPercent: number
  severity: "high" | "medium" | "low"
  aiExplanation?: string
  detectedAt: string
  resolved: boolean
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    loadAnomalies()
  }, [showResolved])

  const loadAnomalies = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAnomalies({
        resolved: showResolved,
        limit: 50,
      })
      setAnomalies(data)
    } catch (error) {
      console.error('Failed to load anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectNewAnomalies = async () => {
    try {
      setDetecting(true)
      await apiClient.detectAnomalies({ days: 7, threshold: 20 })
      await loadAnomalies()
    } catch (error) {
      console.error('Failed to detect anomalies:', error)
    } finally {
      setDetecting(false)
    }
  }

  const resolveAnomaly = async (id: string) => {
    try {
      await apiClient.resolveAnomaly(id)
      await loadAnomalies()
      setSelectedAnomaly(null)
    } catch (error) {
      console.error('Failed to resolve anomaly:', error)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="warning">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge>{severity}</Badge>
    }
  }

  const formatMetricValue = (metricName: string, value: number) => {
    if (metricName === 'spend' || metricName === 'cpc') {
      return `$${value.toFixed(2)}`
    } else if (metricName === 'ctr' || metricName === 'roas') {
      return value.toFixed(2)
    } else {
      return value.toString()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Anomalies</h1>
            <p className="text-muted-foreground">Unusual patterns detected in your metrics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Show Unresolved' : 'Show Resolved'}
            </Button>
            <Button onClick={detectNewAnomalies} disabled={detecting}>
              {detecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Detect Anomalies
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Anomalies List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading anomalies...</p>
            </CardContent>
          </Card>
        ) : anomalies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <p className="text-lg font-medium">No anomalies detected</p>
              <p className="text-sm text-muted-foreground">
                Everything looks normal! Run detection to check for new anomalies.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {anomalies.map((anomaly) => (
              <Card
                key={anomaly.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedAnomaly(anomaly)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(anomaly.severity)}
                        <Badge variant="outline" className="text-xs">
                          {anomaly.entityType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(anomaly.detectedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      <h3 className="font-semibold mb-2">
                        {anomaly.metricName.toUpperCase()} Deviation
                      </h3>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span className="font-medium">
                            {formatMetricValue(anomaly.metricName, anomaly.expectedValue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual: </span>
                          <span className={`font-medium ${
                            anomaly.deviationPercent > 0 ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {formatMetricValue(anomaly.metricName, anomaly.actualValue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {anomaly.deviationPercent > 0 ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className={`font-semibold ${
                            Math.abs(anomaly.deviationPercent) > 50 ? 'text-red-500' :
                            Math.abs(anomaly.deviationPercent) > 30 ? 'text-yellow-500' : ''
                          }`}>
                            {anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {anomaly.aiExplanation && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {anomaly.aiExplanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Anomaly Detail Dialog */}
        <Dialog open={!!selectedAnomaly} onOpenChange={() => setSelectedAnomaly(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                {selectedAnomaly && getSeverityBadge(selectedAnomaly.severity)}
                <Badge variant="outline">
                  {selectedAnomaly?.entityType}
                </Badge>
              </div>
              <DialogTitle>
                {selectedAnomaly?.metricName.toUpperCase()} Anomaly Details
              </DialogTitle>
              <DialogDescription>
                Detected on {selectedAnomaly && format(new Date(selectedAnomaly.detectedAt), 'MMMM dd, yyyy')}
              </DialogDescription>
            </DialogHeader>

            {selectedAnomaly && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expected Value</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(selectedAnomaly.metricName, selectedAnomaly.expectedValue)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Actual Value</p>
                    <p className="text-lg font-semibold text-red-500">
                      {formatMetricValue(selectedAnomaly.metricName, selectedAnomaly.actualValue)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Deviation</p>
                    <p className="text-lg font-semibold">
                      {selectedAnomaly.deviationPercent > 0 ? '+' : ''}{selectedAnomaly.deviationPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {selectedAnomaly.aiExplanation && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedAnomaly.aiExplanation}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedAnomaly(null)}>
                    Close
                  </Button>
                  {!selectedAnomaly.resolved && (
                    <Button onClick={() => resolveAnomaly(selectedAnomaly.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
