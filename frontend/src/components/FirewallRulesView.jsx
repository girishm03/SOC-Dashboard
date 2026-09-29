import React, { useState } from 'react';
import { Shield, Ban, Trash2, Plus, AlertCircle } from 'lucide-react';
import { deleteFirewallRule } from '../services/api';

export default function FirewallRulesView({ rules, onRuleDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (ruleId) => {
    try {
      setDeletingId(ruleId);
      await deleteFirewallRule(ruleId);
      if (onRuleDeleted) onRuleDeleted(ruleId);
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={18} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              PERIMETER FIREWALL DROP TABLE & BLACKLIST
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              AUTOMATED EDGE ENFORCEMENT · {rules.length} ACTIVE DROP RULES
            </p>
          </div>
        </div>
      </div>

      {rules.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active firewall drop rules. Perimeter clear.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)'
              }}>
                <th style={{ padding: '10px 12px' }}>RULE ID</th>
                <th style={{ padding: '10px 12px' }}>BLOCKED IP</th>
                <th style={{ padding: '10px 12px' }}>ACTION</th>
                <th style={{ padding: '10px 12px' }}>REASON / SOURCE INCIDENT</th>
                <th style={{ padding: '10px 12px' }}>ENFORCED AT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>MANAGE</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr 
                  key={rule.rule_id}
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                >
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#00f2fe' }}>
                    {rule.rule_id}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#ff3366' }}>
                    {rule.ip}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                      DROP_ALL
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                    {rule.reason}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {rule.created_at}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      disabled={deletingId === rule.rule_id}
                      onClick={() => handleDelete(rule.rule_id)}
                      className="btn btn-danger btn-sm"
                      title="Unblock IP and remove rule"
                    >
                      <Trash2 size={13} />
                      <span>Unblock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
