import React, { useEffect, useState } from 'react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  countdownSeconds?: number;
}

export function SessionTimeoutModal({ isOpen, onStayLoggedIn, onLogout, countdownSeconds = 30 }: SessionTimeoutModalProps) {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) { setRemaining(countdownSeconds); return; }
    setRemaining(countdownSeconds);
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onLogout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-blue-200">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Session Expiring</h3>
              <p className="text-xs text-amber-700">Your session will expire due to inactivity</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-amber-400 flex items-center justify-center">
            <span className="text-2xl font-bold text-amber-600">{remaining}</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">seconds remaining</p>
          <p className="text-xs text-gray-400">Click below to continue your session</p>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onStayLoggedIn}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
