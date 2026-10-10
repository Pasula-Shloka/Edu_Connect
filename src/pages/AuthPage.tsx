import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      // Validate Institutional Email Patterns
      if (role === 'student') {
        const rollMatch = cleanEmail.match(/^(\d+)(@klh\.edu\.in)?$/);
        if (!rollMatch) {
          setError('Student email must follow the institutional roll number format: rollnumber@klh.edu.in (e.g. 2200030001@klh.edu.in)');
          setLoading(false);
          return;
        }
        cleanEmail = `${rollMatch[1]}@klh.edu.in`;
      } else if (role === 'faculty') {
        if (!cleanEmail.startsWith('fac') && !cleanEmail.startsWith('emp') && !cleanEmail.endsWith('@faculty.edu.in')) {
          setError('Faculty email must follow the faculty pattern: fac[EmpID]@klh.edu.in (e.g. fac10342@klh.edu.in)');
          setLoading(false);
          return;
        }
        if (!cleanEmail.includes('@')) {
          cleanEmail = `${cleanEmail}@klh.edu.in`;
        }
      }

      const { error } = await signUp(cleanEmail, password, fullName, role);
      if (error) setError(error);
      else {
        setMode('signin');
        setError('Account created successfully! You can now sign in with your credentials.');
      }
    } else {
      const { error } = await signIn(cleanEmail, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top right Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      {/* Left panel - Institutional University Showcase with Real Campus Photo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden text-white p-12 flex-col justify-between border-r border-slate-800">
        {/* Background Campus Photo with Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('./campus.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/75 backdrop-blur-[1px]" />

        {/* University Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="flex h-14 w-auto items-center justify-center rounded-xl bg-white p-2 shadow-lg">
            <img src="./klh-logo.png" alt="KL University" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">
              KL University
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Academic Management & Digital Learning Portal
            </p>
          </div>
        </div>

        {/* Central Content */}
        <div className="space-y-6 max-w-lg relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/60">
              <Award className="h-3.5 w-3.5 text-red-400" /> NAAC A++ Accredited • Category 1 University
            </span>
          </div>

          <h2 className="text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
            Seamless academic collaboration for students and faculty.
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Centralized portal for coursework, assignment submissions, real-time evaluation, digital gradebooks, and synchronous interactive sessions.
          </p>

          {/* Institutional Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { title: 'Course Management', desc: 'Syllabus, modules & notes' },
              { title: 'Digital Submissions', desc: 'Deadlines & grading rubrics' },
              { title: 'Faculty Evaluations', desc: 'Direct feedback & scoring' },
              { title: 'Live Classrooms', desc: 'Virtual lecture meetings' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure PostgreSQL Session • KLH Network</span>
          </div>
          <span>v2.4 Production</span>
        </div>
      </div>

      {/* Right panel - Executive Login / Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-auto items-center justify-center rounded-xl bg-white p-2 border border-slate-200 dark:border-slate-800 shadow-sm">
              <img src="./klh-logo.png" alt="KL University" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white leading-tight">
                KL University
              </h2>
              <p className="text-xs text-slate-500">KL EduConnect Academic Portal</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              {mode === 'signin' ? 'Sign in to your account' : 'Register for institutional access'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'signin'
                ? 'Sign in with your email and password. Your dashboard will open automatically according to your role.'
                : 'Select your role and create your institutional credentials.'}
            </p>
          </div>

          {/* Role Selector Tabs - ONLY for Registration */}
          {mode === 'signup' && (
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Register As
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { key: 'student', label: 'Student' },
                    { key: 'faculty', label: 'Faculty' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setRole(tab.key);
                      setError(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      role === tab.key
                        ? 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Administrator registration is restricted to authorized university personnel.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your institutional email"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {error && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  error.includes('successfully') || error.includes('You can now sign in')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Portal' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
            {mode === 'signin' ? "Don't have an account yet? " : 'Already registered with university ID? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-red-700 dark:text-red-400 font-semibold hover:underline"
            >
              {mode === 'signin' ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
