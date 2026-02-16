import React from 'react';
import { Shield, CheckCircle, FileText, Calendar, Building2, Users, Lock, ArrowRight, Star, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../components/Button';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 shadow-sm animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center animate-scale-in">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#334155]">BuildTrust</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('/login')}
              className="text-[#334155] hover:text-[#1E3A8A] transition-all duration-300"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => onNavigate('/register')}
              className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#3B82F6] transition-all duration-500"
              style={{ transitionDelay: '300ms' }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1605159149559-abaaa7bc476c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGNvbnN0cnVjdGlvbiUyMGJ1aWxkaW5nfGVufDB8fDB8fHww)'
          }}
        />
        {/* Dark Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/90 via-[#2563EB]/85 to-[#3B82F6]/90" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-6 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-slide-up delay-100">
              <Star className="w-4 h-4 text-yellow-300 animate-pulse-slow" />
              <span className="text-sm font-medium text-white">Trusted by 100+ International Families</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up delay-200">
              Build Your Dream Home in Africa<br />
              <span className="text-[#FFD700]">With Complete Trust</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-slide-up delay-300">
              Secure escrow platform connecting Africans worldwide with verified construction companies. 
              Fund projects with confidence, approve milestones, and release payments only when work is complete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-400">
              <button
                onClick={() => onNavigate('/register')}
                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold bg-white text-[#1E3A8A] hover:bg-gray-100 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('/consultations')}
                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
              >
                Book Consultation (Paid)
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 text-white/80">
              <div className="flex items-center gap-2 animate-slide-up delay-500">
                <CheckCircle className="w-5 h-5 text-green-300 animate-float" />
                <span className="text-sm whitespace-nowrap">No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2 animate-slide-up delay-600">
                <Shield className="w-5 h-5 text-blue-300 animate-float" style={{ animationDelay: '0.5s' }} />
                <span className="text-sm whitespace-nowrap">100% Secure</span>
              </div>
              <div className="flex items-center gap-2 animate-slide-up delay-700">
                <Zap className="w-5 h-5 text-yellow-300 animate-float" style={{ animationDelay: '1s' }} />
                <span className="text-sm whitespace-nowrap">Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="bg-white border-y border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Projects', value: '500+', icon: Building2 },
              { label: 'Verified Companies', value: '150+', icon: Shield },
              { label: 'Happy Clients', value: '1000+', icon: Users },
              { label: 'Total Escrow', value: '$50M+', icon: TrendingUp },
            ].map((stat, index) => (
              <div key={index} className={`text-center animate-scale-in ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : index === 2 ? 'delay-300' : 'delay-400'}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 mb-3 hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <div className="text-3xl font-bold text-[#334155] mb-1">{stat.value}</div>
                <div className="text-sm text-[#64748B]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-slide-up delay-100">
          <h2 className="text-4xl font-bold text-[#334155] mb-4">How It Works</h2>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            Simple, secure, and transparent. Get started in minutes and build with confidence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              icon: <Calendar className="w-8 h-8" />,
              title: 'Book Consultation',
              description: 'Connect with verified construction companies for an initial consultation',
              gradient: 'from-[#8B5CF6] to-[#6D28D9]',
            },
            {
              icon: <FileText className="w-8 h-8" />,
              title: 'Define Project',
              description: 'Agree on scope, milestones, and payment schedule with complete transparency',
              gradient: 'from-[#1E3A8A] to-[#2563EB]',
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: 'Fund Escrow',
              description: 'Your funds are held securely in escrow until each milestone is approved',
              gradient: 'from-[#16A34A] to-[#15803D]',
            },
            {
              icon: <CheckCircle className="w-8 h-8" />,
              title: 'Approve & Release',
              description: 'Review photo/video evidence and approve payments for completed work',
              gradient: 'from-[#F59E0B] to-[#D97706]',
            },
          ].map((step, index) => (
            <div key={index} className={`relative group animate-slide-up ${index === 0 ? 'delay-200' : index === 1 ? 'delay-300' : index === 2 ? 'delay-400' : 'delay-500'}`}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-8 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#334155] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Why Escrow Matters */}
      <section className="bg-white border-y border-[#E5E7EB] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-slide-up delay-100">
            <h2 className="text-4xl font-bold text-[#334155] mb-4">Why Escrow Matters</h2>
            <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
              Complete financial control and transparency throughout your construction project
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="w-8 h-8" />,
                title: 'Full Financial Control',
                description: 'Release funds only when you approve completed milestones. No surprises, no upfront risks',
                gradient: 'from-[#1E3A8A] to-[#2563EB]',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Verified Companies Only',
                description: 'Every construction company is thoroughly vetted and verified by our admin team',
                gradient: 'from-[#16A34A] to-[#15803D]',
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: 'Evidence-Based Approvals',
                description: 'Review photos and videos of completed work before releasing any payment',
                gradient: 'from-[#F59E0B] to-[#D97706]',
              },
            ].map((item, index) => (
              <div key={index} className={`bg-gradient-to-br from-white to-[#F8FAFC] rounded-2xl border border-[#E5E7EB] shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                index === 0 ? 'animate-slide-in-left delay-200' : 
                index === 1 ? 'animate-scale-in delay-300' : 
                'animate-slide-in-right delay-400'
              }`}>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} text-white mb-6 hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#334155] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 animate-slide-up delay-100">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-slide-up delay-200">
            Join thousands of international families building their dream homes in Africa with complete trust and security
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in delay-300">
            <button
              onClick={() => onNavigate('/register')}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold bg-white text-[#1E3A8A] hover:bg-gray-100 px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1E3A8A] group"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold border-2 border-white text-white hover:bg-white/10 px-10 py-6 text-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6 animate-fade-in delay-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#334155]">BuildTrust</h3>
                <p className="text-xs text-[#64748B]">Secure construction for international clients</p>
              </div>
            </div>
            <p className="text-sm text-[#64748B] text-center md:text-right">
              © 2026 BuildTrust. All rights reserved. Secure construction platform for Africans worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
