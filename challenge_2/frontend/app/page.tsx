import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Search, Star, CheckCircle, Shield, ArrowRight, Sparkles, Zap, Lock } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocHub</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 md:block">
              Features
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-gray-50 px-4 py-16 md:py-24 lg:py-32">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column - Text */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Trusted by 500+ teams worldwide</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Smart Document
                  <br />
                  <span className="text-blue-600">Management</span>
                  <br />
                  for Modern Teams
                </h1>

                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600 lg:mx-0">
                  A collaborative platform that combines powerful document management with social
                  features. Share knowledge, collaborate effectively, and keep your team perfectly in sync.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-start">
                <Link href={ROUTES.LOGIN}>
                  <Button size="lg" className="w-full bg-blue-600 text-white px-6 hover:bg-blue-700 sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full border-gray-300 hover:bg-gray-50 sm:w-auto">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 lg:pt-12">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900 sm:text-4xl">500+</p>
                  <p className="text-sm text-gray-600">Active Teams</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900 sm:text-4xl">50K+</p>
                  <p className="text-sm text-gray-600">Documents</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900 sm:text-4xl">99.9%</p>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              </div>
            </div>

            {/* Right column - Visual */}
            <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:mx-0 lg:max-w-none">
              <div className="relative w-full">
                {/* Main card */}
                <Card className="border border-gray-200 bg-white shadow-2xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                          JD
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">John Doe</div>
                          <div className="text-xs text-gray-500">2 hours ago</div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <h3 className="font-bold text-gray-900 text-lg">Q4 Product Roadmap 2024</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          A comprehensive overview of our product development strategy for the upcoming quarter, including key milestones and deliverables.
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">Planning</span>
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">Strategy</span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">2024</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating elements */}
                <div className="absolute -right-6 -top-6 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Approved</span>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-gray-900">+24 Stars</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-gray-100 bg-white px-4 py-20 lg:py-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700">
              <Zap className="h-3.5 w-3.5" />
              <span>Powerful Features</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Everything you need to
              <br />
              <span className="text-blue-600">manage your docs</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Powerful features designed to help your team collaborate better and work smarter
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Document Management</h3>
                <p className="leading-relaxed text-gray-600">
                  Create, organize, and manage all your documents in one centralized, secure platform with version control
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Social Collaboration</h3>
                <p className="leading-relaxed text-gray-600">
                  Comment, discuss, and collaborate with your team in a familiar social interface that everyone loves
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <Search className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">AI-Powered Search</h3>
                <p className="leading-relaxed text-gray-600">
                  Find exactly what you need with semantic search and intelligent filters powered by machine learning
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Approval Workflow</h3>
                <p className="leading-relaxed text-gray-600">
                  Streamlined review and approval process with notifications ensures document quality and compliance
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Access Control</h3>
                <p className="leading-relaxed text-gray-600">
                  Role-based permissions and tag-based access control for enterprise-grade security standards
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Smart Bookmarks</h3>
                <p className="leading-relaxed text-gray-600">
                  Star and organize your favorite documents for lightning-fast access whenever you need them
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-20 lg:py-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">Trusted by teams worldwide</h2>
            <p className="text-lg text-gray-600">Join hundreds of companies already using DocHub</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            <Card className="border border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-gray-700">
                  "DocHub transformed how our team collaborates. The approval workflow saved us hours every week!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                    SJ
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-gray-700">
                  "The AI search feature is incredible. Finding documents has never been easier for our entire team!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-semibold text-white">
                    MC
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Michael Chen</p>
                    <p className="text-sm text-gray-600">Engineering Lead</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-gray-700">
                  "Best document management tool we've used. Simple, powerful, and absolutely beautiful design!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-sm font-semibold text-white">
                    ER
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Emily Rodriguez</p>
                    <p className="text-sm text-gray-600">Design Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-20 lg:py-28">
        <div className="container relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400 bg-blue-500 px-3.5 py-1.5 text-sm font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start your free 14-day trial</span>
          </div>
          
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            Ready to transform your
            <br />
            document workflow?
          </h2>
          
          <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-50">
            Join 500+ teams already using DocHub to manage their knowledge and collaborate better
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href={ROUTES.LOGIN}>
              <Button size="lg" className="w-full bg-white px-8 text-base font-semibold text-blue-600 hover:bg-blue-50 sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full border-2 border-white/50 bg-transparent text-base font-semibold text-white hover:bg-white/10 hover:border-white sm:w-auto">
              Schedule Demo
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 lg:gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">DocHub</span>
              </div>
              <p className="text-sm text-gray-600">
                The modern way to manage and share your team's knowledge
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Product</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600">Security</a></li>
                <li><a href="#" className="hover:text-blue-600">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600">Terms</a></li>
                <li><a href="#" className="hover:text-blue-600">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 DocHub. Built with 💙 for modern teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
