import React from 'react';
import { Shield, CheckCircle, FileText, Clock, Calendar } from 'lucide-react';
import { Button } from '../components/Button';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#334155]">BuildTrust</h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onNavigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => onNavigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-semibold text-[#334155] mb-6">
            Build Your Dream Home in Africa with Complete Trust
          </h2>
          <p className="text-lg text-[#64748B] mb-8">
            Secure escrow platform connecting Africans in the diaspora with verified construction companies. 
            Fund projects with confidence, approve milestones, and release payments only when work is complete.
          </p>
          <Button size="lg" onClick={() => onNavigate('/consultations')}>
            Book Free Consultation
          </Button>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="bg-white border-y border-[#E5E7EB] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-semibold text-[#334155] text-center mb-12">
            How It Works
          </h3>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Calendar className="w-8 h-8" />,
                title: '1. Book Consultation',
                description: 'Connect with verified construction companies for a free initial consultation.',
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: '2. Define Project',
                description: 'Agree on scope, milestones, and payment schedule with complete transparency.',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: '3. Fund Escrow',
                description: 'Your funds are held securely in escrow until each milestone is approved.',
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: '4. Approve & Release',
                description: 'Review photo/video evidence and approve payments for completed work.',
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A8A] text-white rounded-full mb-4">
                  {step.icon}
                </div>
                <h4 className="text-lg font-medium text-[#334155] mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-[#64748B]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Escrow Matters */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-semibold text-[#334155] text-center mb-12">
          Why Escrow Matters
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Full Financial Control',
              description: 'Release funds only when you approve completed milestones. No surprises, no upfront risks.',
            },
            {
              title: 'Verified Companies Only',
              description: 'Every construction company is thoroughly vetted and verified by our admin team.',
            },
            {
              title: 'Evidence-Based Approvals',
              description: 'Review photos and videos of completed work before releasing any payment.',
            },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-[#1E3A8A]" />
              </div>
              <h4 className="text-lg font-medium text-[#334155] mb-2">
                {item.title}
              </h4>
              <p className="text-sm text-[#64748B]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-[#1E3A8A] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-semibold text-white mb-4">
            Ready to Start Building?
          </h3>
          <p className="text-lg text-white/80 mb-8">
            Book a free consultation with a verified construction company today.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => onNavigate('/register')}
          >
            Create Free Account
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-[#64748B]">
            © 2026 BuildTrust. Secure construction for the diaspora.
          </p>
        </div>
      </footer>
    </div>
  );
}