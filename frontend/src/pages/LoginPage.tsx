import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, setTokens } from '../utils/api';

export function LoginPage() {
  const { login, verifyMFA, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionExpired = new URLSearchParams(window.location.search).get('expired') === '1';

  // Countdown timer for account lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutTimer.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            if (lockoutTimer.current) clearInterval(lockoutTimer.current);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (lockoutTimer.current) clearInterval(lockoutTimer.current); };
  }, [lockoutSeconds > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaSetupMessage, setMfaSetupMessage] = useState('');

  // Forced MFA setup state (NIST IA-2(1) enforcement)
  const [mfaSetupToken, setMfaSetupToken] = useState('');
  const [mfaSetupStep, setMfaSetupStep] = useState<'intro' | 'qr' | 'verify' | 'backup'>('intro');
  const [mfaSetupSecret, setMfaSetupSecret] = useState('');
  const [mfaSetupUri, setMfaSetupUri] = useState('');
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLockoutSeconds(0);
    if (lockoutTimer.current) clearInterval(lockoutTimer.current);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfa_required) {
        setMfaRequired(true);
        setMfaToken(result.mfa_token!);
      } else if (result.mfa_setup_required) {
        setMfaSetupRequired(true);
        setMfaSetupToken(result.mfa_setup_token || '');
        setMfaSetupMessage(result.message || 'MFA is required for privileged accounts.');
        setMfaSetupStep('intro');
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      // Extract retry_after from error if it's a lockout response
      if (err.retry_after && typeof err.retry_after === 'number') {
        setLockoutSeconds(err.retry_after);
      } else if (msg.toLowerCase().includes('locked')) {
        // Fallback: extract minutes from message like "Try again in 15 minutes"
        const match = msg.match(/(\d+)\s*minute/);
        if (match) setLockoutSeconds(parseInt(match[1], 10) * 60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMFA(mfaToken, mfaCode);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const data = await api('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      // If email delivery is not configured, API returns the token directly
      if (data.reset_token) {
        window.location.href = `/reset-password?token=${encodeURIComponent(data.reset_token)}`;
        return;
      }
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetMfa = () => {
    setMfaRequired(false);
    setMfaToken('');
    setMfaCode('');
    setError('');
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotSuccess(false);
    setForgotError('');
  };

  // Forced MFA setup handlers
  const startForcedMfaSetup = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/v1/auth/mfa/forced-setup', {
        method: 'POST',
        body: JSON.stringify({ mfa_setup_token: mfaSetupToken }),
      });
      setMfaSetupSecret(data.secret);
      setMfaSetupUri(data.uri);
      setMfaSetupStep('qr');
    } catch (err: any) {
      setError(err.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyForcedMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/v1/auth/mfa/forced-verify', {
        method: 'POST',
        body: JSON.stringify({ mfa_setup_token: mfaSetupToken, code: mfaSetupCode }),
      });
      setMfaBackupCodes(data.backup_codes);
      setTokens(data.access_token, data.refresh_token);
      setMfaSetupStep('backup');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const completeForcedMfaSetup = async () => {
    await refreshUser();
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(mfaBackupCodes.join('\n')).then(() => {
      setBackupCodesCopied(true);
      setTimeout(() => setBackupCodesCopied(false), 2000);
    });
  };

  const resetForcedMfaSetup = () => {
    setMfaSetupRequired(false);
    setMfaSetupToken('');
    setMfaSetupStep('intro');
    setMfaSetupSecret('');
    setMfaSetupUri('');
    setMfaSetupCode('');
    setMfaBackupCodes([]);
    setBackupCodesCopied(false);
    setMfaSetupMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Forge Cyber Defense" className="w-48 h-48 mx-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-2xl font-bold text-white">Forge Cyber Defense</h1>
          <p className="text-blue-200 mt-1">Enterprise GRC Platform</p>
        </div>

        {/* NIST AC-8 / TAC 202: System Use Notification */}
        <div className="bg-blue-950/80 border border-blue-400/30 rounded-lg p-4 mb-4 text-xs text-blue-100/80 leading-relaxed">
          <p className="font-semibold text-blue-100 mb-1 text-sm">System Use Notification</p>
          <p>This is a Forge Cyber Defense system for authorized use only. By accessing this system, you consent to monitoring and recording of all activities. Unauthorized use is prohibited and subject to criminal and civil penalties. Use of this system constitutes consent to monitoring.</p>
        </div>

        {mfaSetupRequired ? (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['Setup', 'Scan', 'Verify', 'Backup'].map((label, i) => {
                const stepIndex = ['intro', 'qr', 'verify', 'backup'].indexOf(mfaSetupStep);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                    {i < 3 && <div className={`w-6 h-0.5 ${i < stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {mfaSetupStep === 'intro' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">MFA Setup Required</h2>
                  <p className="text-sm text-gray-600 mt-2">{mfaSetupMessage}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
                  <p className="font-medium mb-1">NIST IA-2(1) Compliance</p>
                  <p>Two-factor authentication is mandatory for administrator accounts. You will need an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.).</p>
                </div>
                <button
                  type="button"
                  onClick={startForcedMfaSetup}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Setting up...' : 'Begin MFA Setup'}
                </button>
                <button
                  type="button"
                  onClick={resetForcedMfaSetup}
                  className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to login
                </button>
              </>
            )}

            {mfaSetupStep === 'qr' && (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Scan QR Code</h2>
                  <p className="text-sm text-gray-500 mt-1">Open your authenticator app and scan this code.</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 mb-4 text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSetupUri)}`}
                    alt="MFA QR Code"
                    className="mx-auto w-48 h-48"
                  />
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1 text-center">Or enter this key manually:</p>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-center font-mono text-sm tracking-wider select-all break-all">
                    {mfaSetupSecret}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaSetupStep('verify')}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  I've Scanned the Code
                </button>
                <button
                  type="button"
                  onClick={resetForcedMfaSetup}
                  className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {mfaSetupStep === 'verify' && (
              <form onSubmit={verifyForcedMfaSetup}>
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Verify Setup</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
                </div>
                <input
                  type="text"
                  value={mfaSetupCode}
                  onChange={(e) => setMfaSetupCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  placeholder="000000"
                  autoFocus
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || mfaSetupCode.length < 6}
                  className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable MFA'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaSetupStep('qr'); setMfaSetupCode(''); setError(''); }}
                  className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to QR code
                </button>
              </form>
            )}

            {mfaSetupStep === 'backup' && (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">MFA Enabled Successfully</h2>
                  <p className="text-sm text-gray-500 mt-1">Save your backup codes in a secure location.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                  <p className="font-medium">Important:</p>
                  <p>These codes can be used if you lose access to your authenticator app. Each code can only be used once. Store them securely.</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    {mfaBackupCodes.map((code) => (
                      <div key={code} className="font-mono text-sm text-center bg-white rounded px-2 py-1 border">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyBackupCodes}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors mb-3"
                >
                  {backupCodesCopied ? 'Copied!' : 'Copy Backup Codes'}
                </button>
                <button
                  type="button"
                  onClick={completeForcedMfaSetup}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue to ForgeComply 360
                </button>
              </>
            )}
          </div>
        ) : mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/[^A-Za-z0-9-]/g, ''))}
              maxLength={9}
              placeholder="000000"
              autoFocus
              autoComplete="one-time-code"
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">You can also use a backup code (XXXX-XXXX).</p>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={resetMfa}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to login
            </button>
          </form>
        ) : showForgotPassword ? (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            {forgotSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  If an account exists with that email, you will receive a password reset link shortly.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  The link will expire in 15 minutes. Check your spam folder if you don't see the email.
                </p>
                <button
                  type="button"
                  onClick={resetForgotPassword}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Reset Your Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {forgotError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="you@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={resetForgotPassword}
                  className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to login
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

            {sessionExpired && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Your session has expired due to inactivity. Please sign in again.
              </div>
            )}

            {error && (
              <div className={`${lockoutSeconds > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg mb-4 text-sm`}>
                <p>{lockoutSeconds > 0 ? 'Account temporarily locked due to too many failed attempts.' : error}</p>
                {lockoutSeconds > 0 && (
                  <p className="mt-1 font-medium">
                    You can try again in {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutSeconds > 0}
              className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : lockoutSeconds > 0 ? `Locked (${Math.floor(lockoutSeconds / 60)}:${String(lockoutSeconds % 60).padStart(2, '0')})` : 'Sign In'}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Need an account? Contact your administrator.
            </p>
          </form>
        )}

        <p className="text-center text-xs text-blue-200/60 mt-6">
          Forge Cyber Defense - Veteran-Owned Business
        </p>
      </div>
    </div>
  );
}
