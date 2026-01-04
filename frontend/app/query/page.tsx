"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { MessageSquare, Send, Sparkles, HelpCircle } from "lucide-react"

interface QueryResult {
  question: string
  answer: string
  context: {
    campaigns: number
    adsets: number
    ads: number
    totalSpend: number
    dateRange: string
  }
}

const exampleQuestions = [
  "How many campaigns are currently running?",
  "What is my average ROAS across all campaigns?",
  "Which campaigns are spending the most money?",
  "How can I improve my click-through rate?",
  "What's my total spend for this month?",
  "Are there any campaigns with ROAS below 1.0?",
]

export default function QueryPage() {
  const [question, setQuestion] = useState("")
  const [history, setHistory] = useState<QueryResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    try {
      setLoading(true)
      const result = await apiClient.query(question)
      setHistory([result, ...history])
      setQuestion("")
    } catch (error) {
      console.error('Failed to query:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = async (exampleQuestion: string) => {
    setQuestion(exampleQuestion)
    try {
      setLoading(true)
      const result = await apiClient.query(exampleQuestion)
      setHistory([result, ...history])
      setQuestion("")
    } catch (error) {
      console.error('Failed to query:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ask Your Data</h1>
          <p className="text-muted-foreground">
            Get instant answers about your campaigns using natural language
          </p>
        </div>

        {/* Query Input */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your ad campaigns..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="lg" disabled={loading || !question.trim()}>
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Example Questions */}
        {history.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="h-5 w-5" />
                Example Questions
              </CardTitle>
              <CardDescription>Click on any question to try it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(q)}
                    className="text-left p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Query History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Conversation History</h2>
            {history.map((result, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6 space-y-4">
                  {/* Question */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">You asked:</p>
                      <p className="text-muted-foreground mt-1">{result.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">AI Answer:</p>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        {result.answer}
                      </p>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="pt-3 border-t">
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Campaigns: {result.context.campaigns}</span>
                      <span>Ad Sets: {result.context.adsets}</span>
                      <span>Ads: {result.context.ads}</span>
                      <span>Total Spend: ${result.context.totalSpend.toFixed(2)}</span>
                      <span>Period: {result.context.dateRange}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
