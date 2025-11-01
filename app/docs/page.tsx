'use client'

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, BookOpen, Zap, ArrowLeft } from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-24 pt-32">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to integrate proxy rental into your app
            </p>
          </div>

          <Tabs defaultValue="quickstart" className="mb-12">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
              <TabsTrigger value="reference">API Reference</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="quickstart" className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>Get up and running in minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. Get your API key</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign up and navigate to your dashboard to generate an API token.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}>Create Account</a>
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2. Make your first request</h3>
                    <div className="bg-background/50 p-4 rounded-lg border border-border">
                      <code className="text-sm text-accent">
                        {`curl -X POST https://api.iproxy.com/v1/proxies/rent \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "location": "us-east-1",
    "type": "residential",
    "duration": "1h"
  }'`}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reference" className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">POST /v1/proxies/rent</h3>
                    <p className="text-sm text-muted-foreground mb-4">Rent a new proxy with specified configuration</p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-background/50 p-4 rounded-lg border border-border text-sm">
                          <code className="text-accent">{`{
  "location": "us-east-1",     // Required
  "type": "residential",        // residential | datacenter
  "duration": "1h",             // 1h, 24h, 7d, 30d
  "rotation": "auto"            // auto | manual | sticky
}`}</code>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Response</h4>
                        <div className="bg-background/50 p-4 rounded-lg border border-border text-sm">
                          <code className="text-accent">{`{
  "proxy": {
    "id": "prx_123456",
    "host": "proxy.iproxy.com",
    "port": 8080,
    "username": "user_abc",
    "password": "pass_xyz",
    "expires_at": "2024-01-01T13:00:00Z"
  }
}`}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">GET /v1/proxies</h3>
                    <p className="text-sm text-muted-foreground mb-4">List all your active proxies</p>
                    <div className="bg-background/50 p-4 rounded-lg border border-border text-sm">
                      <code className="text-accent">{`?status=active      // active | expired | all
&limit=10           // Default: 10, Max: 100
&page=1             // Pagination`}</code>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">DELETE /v1/proxies/:id</h3>
                    <p className="text-sm text-muted-foreground mb-4">Release a proxy before it expires</p>
                    <div className="bg-background/50 p-4 rounded-lg border border-border text-sm">
                      <code className="text-accent">{`{
  "success": true,
  "message": "Proxy released successfully"
}`}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Code Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">JavaScript / Node.js</h3>
                    <div className="bg-background/50 p-4 rounded-lg border border-border">
                      <code className="text-sm text-accent">{`const response = await fetch('https://api.iproxy.com/v1/proxies/rent', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    location: 'us-east-1',
    type: 'residential',
    duration: '1h'
  })
});

const data = await response.json();
console.log(data.proxy.host);`}</code>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Python</h3>
                    <div className="bg-background/50 p-4 rounded-lg border border-border">
                      <code className="text-sm text-accent">{`import requests

response = requests.post(
    'https://api.iproxy.com/v1/proxies/rent',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'location': 'us-east-1',
        'type': 'residential',
        'duration': '1h'
    }
)

data = response.json()
print(data['proxy']['host'])`}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
