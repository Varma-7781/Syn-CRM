import { useEffect, useState } from 'react';
import { Bell, Phone, User, X, CheckCircle, XCircle } from 'lucide-react';
import { Lead } from '../../types';

interface FollowUpReminderPopupProps {
  lead: Lead;
  minutesRemaining: number;
  onCalled: () => void;
  onDismiss: () => void;
  onAutoExpire: () => void;
}

export function FollowUpReminderPopup({
  lead,
  minutesRemaining,
  onCalled,
  onDismiss,
  onAutoExpire,
}: FollowUpReminderPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes = 300 seconds

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    const expireTimer = setTimeout(() => {
      handleAutoExpire();
    }, 300000); // 5 minutes

    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(expireTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  const handleCalled = () => {
    setIsExiting(true);
    setTimeout(() => {
      onCalled();
    }, 350);
  };

  const handleDismissClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 350);
  };

  const handleAutoExpire = () => {
    setIsExiting(true);
    setTimeout(() => {
      onAutoExpire();
    }, 350);
  };

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: isVisible && !isExiting ? 'translateX(-50%)' : 'translate(-50%, -150%)',
        zIndex: 999999,
        width: '420px',
        maxWidth: '92vw',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
          borderRadius: '16px',
          padding: '2px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.4)',
        }}
      >
        <div
          style={{
            background: '#0f172a',
            borderRadius: '14px',
            padding: '20px',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <button
            onClick={handleDismissClick}
            aria-label="Close reminder"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                flexShrink: 0,
              }}
            >
              <Bell size={20} color="#ffffff" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                Follow-up Reminder
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#fbbf24', fontWeight: '600' }}>
                {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''} until scheduled contact
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.75)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '14px',
              border: '1px solid rgba(71, 85, 105, 0.5)',
            }}
          >
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(71, 85, 105, 0.4)' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px' }}>
                COMPANY
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                {lead.companyName || lead.company}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>
                  CLIENT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <User size={14} color="#fbbf24" />
                  <span style={{ fontSize: '13.5px', color: '#e2e8f0', fontWeight: '500' }}>{lead.contactName || lead.client}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>
                  PHONE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Phone size={14} color="#4ade80" />
                  <a href={`tel:${lead.phone}`} style={{ fontSize: '13.5px', color: '#e2e8f0', textDecoration: 'none', fontWeight: '500' }}>
                    {lead.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button
              onClick={handleCalled}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={16} />
              Called
            </button>
            <button
              onClick={handleDismissClick}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <XCircle size={16} />
              Dismiss
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
            Auto-dismiss in: <span style={{ color: timeRemaining < 60 ? '#ef4444' : '#fbbf24' }}>{formatTimeRemaining()}</span>
          </div>

          <div style={{ height: '3px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #ea580c, #dc2626)',
                width: `${(timeRemaining / 300) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
