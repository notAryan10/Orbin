import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  MessageSquare, 
  BarChart2, 
  Settings, 
  ChevronRight, 
  Upload,
  Brain,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { workspaceApi, documentApi, aiApi } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const res = await workspaceApi.list();
        setWorkspaces(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch workspaces", e);
      }
    };
    fetchWorkspaces();
  }, [navigate]);

  const fetchDocuments = async () => {
    if (!selectedId) return;
    try {
      const res = await documentApi.listByWorkspace(selectedId);
      setDocuments(res.data);
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateWorkspace = async () => {
    const name = prompt('Enter workspace name:');
    if (!name) return;

    try {
      const res = await workspaceApi.create({ name });
      const newWs = res.data;
      setWorkspaces([...workspaces, newWs]);
      setSelectedId(newWs.id);
    } catch (e) {
      alert('Failed to create workspace');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', selectedId);
    formData.append('title', file.name);

    try {
      await documentApi.upload(formData);
      alert('Document uploaded! It is now being processed in the background. Please wait a moment before querying it.');
      // Refresh documents
      const res = await documentApi.listByWorkspace(selectedId);
      setDocuments(res.data);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Upload failed. Ensure backend is running and you are logged in.';
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !selectedId || isSending) return;

    const userMessage = userInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setUserInput('');
    setIsSending(true);

    try {
      const res = await aiApi.query({
        query: userMessage,
        workspaceId: selectedId,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
      });

      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error while searching your study materials. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeQuiz = async () => {
    if (!selectedId) return;
    setIsSending(true);
    try {
      const res = await aiApi.generateQuiz({
        workspaceId: selectedId,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
      });
      
      if (!res.data || !res.data.questions || res.data.questions.length === 0) {
        throw new Error('AI failed to generate questions. Please try again or upload more content.');
      }

      setCurrentQuiz(res.data);
      setIsQuizOpen(true);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to generate quiz. Ensure you have processed documents.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const activeWorkspace = workspaces.find(w => w.id === selectedId) || workspaces[0];

  return (
    <div style={{ display: 'flex', height: '100vh', paddingTop: '5.5rem' }}>
      {/* Sidebar */}
      <aside className="glass" style={{ 
        width: '300px', 
        margin: '1rem', 
        marginRight: '0.5rem', 
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            My Workspaces
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {workspaces.map(ws => (
              <motion.div
                key={ws.id}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedId(ws.id)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  background: activeWorkspace?.id === ws.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: `1px solid ${activeWorkspace?.id === ws.id ? 'var(--primary)' : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ws.name || ws.title}</div>
              </motion.div>
            ))}
            <button 
              onClick={handleCreateWorkspace}
              className="btn btn-outline" 
              style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <Plus size={16} /> New Workspace
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SidebarLink icon={<Settings size={18} />} label="Settings" />
          <SidebarLink icon={<BarChart2 size={18} />} label="Analytics" />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
        <header className="glass" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{activeWorkspace?.title}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{activeWorkspace?.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-icon" 
              onClick={fetchDocuments}
              title="Refresh Documents"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              accept=".pdf,.txt"
            />
            <button 
              className="btn btn-primary" 
              onClick={handleUploadClick} 
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleTakeQuiz}
              disabled={isSending || documents.length === 0}
              style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}
            >
              {isSending && isQuizOpen === false ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
              Take Quiz
            </button>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {documents.length > 0 ? (
            documents.map(doc => (
              <DocumentCard 
                key={doc.id}
                title={doc.title} 
                date={new Date(doc.createdAt).toLocaleDateString()} 
                size={doc.status}
                isSelected={selectedDocIds.includes(doc.id)}
                onClick={() => doc.status === 'COMPLETED' && toggleDocSelection(doc.id)}
              />
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '15px' }}>
              No documents yet. Upload your first study material!
            </div>
          )}
        </section>

        {/* Chat / Study Assistant */}
        <section className="glass" style={{ flex: 1, padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageSquare size={20} color="var(--primary)" /> 
            Study Assistant
            {selectedDocIds.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                {selectedDocIds.length} docs selected
              </span>
            )}
          </h3>
          
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                <p>Select a document above to focus the context, or just start asking!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((m, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    style={{ 
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '1rem',
                      borderRadius: '15px',
                      background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                  >
                    {m.content}
                  </motion.div>
                ))}
                {isSending && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                  >
                    Assistant is thinking...
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <input 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={selectedDocIds.length > 0 ? `Asking about ${selectedDocIds.length} documents...` : "Ask anything about your study materials..."} 
              style={{ flex: 1 }} 
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSendMessage}
              disabled={isSending || !userInput.trim()}
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : 'Send'}
            </button>
          </div>
        </section>
      </main>

      {/* Quiz Modal */}
      <AnimatePresence>
        {isQuizOpen && (
          <QuizModal 
            quiz={currentQuiz} 
            onClose={() => setIsQuizOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarLink = ({ icon, label }: { icon: any, label: string }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem', 
    padding: '0.75rem', 
    color: 'var(--text-muted)', 
    cursor: 'pointer',
    borderRadius: '10px'
  }}>
    {icon} <span>{label}</span>
  </div>
);

const DocumentCard = ({ title, date, size, isSelected, onClick }: { title: string, date: string, size: string, isSelected: boolean, onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="glass" 
    style={{ 
      padding: '1.5rem', 
      position: 'relative',
      opacity: (size === 'PENDING' || size === 'PROCESSING') ? 0.7 : 1,
      border: isSelected ? '2px solid var(--primary)' : (size === 'FAILED' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'),
      cursor: size === 'COMPLETED' ? 'pointer' : 'default',
      transition: 'border 0.2s'
    }}
  >
    <div style={{ color: size === 'FAILED' ? 'var(--accent)' : 'var(--primary)', marginBottom: '1rem' }}>
      {(size === 'PENDING' || size === 'PROCESSING') ? <Loader2 className="animate-spin" size={32} /> : <FileText size={32} />}
    </div>
    {isSelected && (
      <div style={{ position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
    )}
    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {date} • <span style={{ 
        textTransform: 'uppercase', 
        fontSize: '0.7rem', 
        fontWeight:700,
        color: size === 'COMPLETED' ? '#10b981' : (size === 'FAILED' ? '#ef4444' : 'var(--primary)')
      }}>
        {size}
      </span>
    </div>
    <div style={{ position: 'absolute', right: '1rem', bottom: '1rem', color: 'var(--text-muted)' }}>
       {size === 'COMPLETED' && <ChevronRight size={isSelected ? 20 : 18} color={isSelected ? 'var(--primary)' : undefined} />}
    </div>
  </motion.div>
);

const QuizModal = ({ quiz, onClose }: { quiz: any, onClose: () => void }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSubmit = () => {
    if (!quiz?.questions) return;
    let s = 0;
    quiz.questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) s++;
    });
    setScore(s);
    setSubmitted(true);
  };

  if (!quiz || !quiz.questions) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.8)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass" 
        style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>{quiz.title || 'Study Quiz'}</h2>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>

        {!submitted ? (
          <div>
            {quiz.questions.map((q: any, idx: number) => (
              <div key={q.id} style={{ marginBottom: '2rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{idx + 1}. {q.text}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {JSON.parse(q.options).map((opt: string) => (
                    <div 
                      key={opt}
                      onClick={() => setAnswers({...answers, [q.id]: opt})}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '10px', 
                        background: answers[q.id] === opt ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${answers[q.id] === opt ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: '1rem' }}>
              Submit Quiz
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}>
              {score}/{quiz.questions.length}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Excellent job! You've mastered {Math.round((score/quiz.questions.length)*100)}% of this material.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Back to Dashboard</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
