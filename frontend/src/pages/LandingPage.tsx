import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div style={{ paddingTop: '8rem' }}>
      {/* Background Blurs */}
      <div className="bg-blur bg-blur-1"></div>
      <div className="bg-blur bg-blur-2"></div>

      {/* Hero Section */}
      <section className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span style={{ 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary)', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            fontSize: '0.9rem',
            fontWeight: 600,
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            The Future of Study Workspaces
          </span>
          <h1 style={{ fontSize: '4.5rem', marginTop: '1.5rem', lineHeight: 1.1 }}>
            Turn Static Notes Into <br /> 
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dynamic Knowledge
            </span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '2rem auto' }}>
            Transform your PDFs, textbooks, and notes into interactive study partners. Chat with your documents, generate instant quizzes, and master complex concepts effortlessly.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Start Studying Free
            </Link>
            <Link to="/demo" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Watch Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container" style={{ padding: '6rem 0' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          <FeatureCard 
            icon={<Brain color="var(--primary)" />}
            title="Semantic RAG Chat"
            description="Deep deep-dive into your materials with an AI that knows every sentence you've uploaded."
          />
          <FeatureCard 
            icon={<Zap color="var(--secondary)" />}
            title="AI Quiz Generator"
            description="Instance assessments matched to your specific curriculum. Test your mastery in seconds."
          />
          <FeatureCard 
            icon={<Sparkles color="var(--accent)" />}
            title="Concept Simplifier"
            description="Complex quantum physics? Simplified into relatable metaphors by our specialized tutor engine."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="glass" 
    style={{ padding: '2rem', textAlign: 'left' }}
  >
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      width: '50px', 
      height: '50px', 
      borderRadius: '12px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: '1.5rem'
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', background: 'none', WebkitTextFillColor: 'white' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{description}</p>
  </motion.div>
);

export default LandingPage;
