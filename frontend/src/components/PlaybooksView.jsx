import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckCircle, Circle, Play, ShieldAlert, 
  ShieldCheck, ArrowRight, Zap, RefreshCw 
} from 'lucide-react';
import { fetchPlaybooks, executePlaybookStep } from '../services/api';

export default function PlaybooksView() {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingStep, setExecutingStep] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPlaybooks();
        setPlaybooks(data);
      } catch (err) {
        console.error("Failed to load playbooks:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExecute = async (playbookId, stepId) => {
    try {
      setExecutingStep(stepId);
      await executePlaybookStep(playbookId, stepId);
      setPlaybooks(prev => prev.map(pb => {
        if (pb.id === playbookId) {
          return {
            ...pb,
            steps: pb.steps.map(s => s.id === stepId ? { ...s, completed: true } : s)
          };
        }
        return pb;
      }));
    } catch (err) {
      alert(`Step execution failed: ${err.message}`);
    } finally {
      setExecutingStep(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={18} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              AUTOMATED INCIDENT RESPONSE PLAYBOOKS (SOAR)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              NIST 800-61 / SANS IR STANDARD OPERATING PROCEDURES & REMEDIATION ORCHESTRATION
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Incident Response Playbooks...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {playbooks.map((pb) => {
            const completedCount = pb.steps.filter(s => s.completed).length;
            const progressPct = Math.round((completedCount / pb.steps.length) * 100);

            return (
              <div 
                key={pb.id}
                style={{
                  background: 'rgba(11, 16, 30, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Playbook Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-critical">{pb.severity}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {pb.id} · {pb.framework}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4fc', marginTop: '4px' }}>
                      {pb.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {pb.description}
                    </p>
                  </div>

                  {/* Progress Gauge */}
                  <div style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>PROGRESS</span>
                      <span style={{ color: progressPct === 100 ? '#10b981' : 'var(--accent-cyan)', fontWeight: 700 }}>
                        {progressPct}% ({completedCount}/{pb.steps.length})
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background: progressPct === 100 ? '#10b981' : 'linear-gradient(90deg, #00f2fe, #3b82f6)',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Steps Timeline Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {pb.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: step.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: step.completed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {step.completed ? (
                          <CheckCircle size={16} color="#10b981" />
                        ) : (
                          <Circle size={16} color="#64748b" />
                        )}
                        <div>
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            PHASE {idx + 1}: {step.phase?.toUpperCase()}
                          </div>
                          <div style={{ fontSize: '13px', color: step.completed ? '#cbd5e1' : '#f0f4fc', fontWeight: 500 }}>
                            {step.action}
                          </div>
                        </div>
                      </div>

                      <div>
                        {step.completed ? (
                          <span className="badge badge-success" style={{ fontSize: '10px' }}>
                            EXECUTED
                          </span>
                        ) : step.automated ? (
                          <button
                            disabled={executingStep === step.id}
                            onClick={() => handleExecute(pb.id, step.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            <Zap size={12} />
                            <span>{executingStep === step.id ? 'Running...' : 'Execute SOAR'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleExecute(pb.id, step.id)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            <span>Mark Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
