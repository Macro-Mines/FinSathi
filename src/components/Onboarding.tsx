import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Target, Wallet, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { IncomeBracket } from '../types';

interface OnboardingProps {
  onComplete: (data: {
    incomeBracket: IncomeBracket;
    goals: string[];
    preferredLanguage: string;
  }) => void;
}

const GOALS = [
  'Save for a house',
  'Retire early',
  'Buy a car',
  'Education fund',
  'Emergency fund',
  'Start investing',
  'Debt management',
  'Travel fund'
];

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'hinglish', name: 'Hinglish' }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState<IncomeBracket>('5-10L');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleComplete = () => {
    onComplete({
      incomeBracket: income,
      goals: selectedGoals,
      preferredLanguage: language
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[var(--bg-primary)] rounded-3xl shadow-xl overflow-hidden border border-[var(--border-default)] transition-colors"
      >
        <div className="p-8">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  step >= i ? "bg-blue-600" : "bg-[var(--bg-secondary)]"
                )}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                    <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--text-primary)]">What's your annual income?</h2>
                  <p className="text-[var(--text-secondary)]">This helps us tailor tax and investment advice for you.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(['0-5L', '5-10L', '10-20L', '20L+'] as IncomeBracket[]).map(bracket => (
                    <button
                      key={bracket}
                      onClick={() => setIncome(bracket)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between",
                        income === bracket 
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                          : "border-[var(--border-default)] hover:border-gray-200 dark:hover:border-gray-600 text-[var(--text-secondary)]"
                      )}
                    >
                      <span className="font-semibold text-lg">{bracket} INR</span>
                      {income === bracket && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--text-primary)]">What are your goals?</h2>
                  <p className="text-[var(--text-secondary)]">Select all that apply to your financial journey.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left",
                        selectedGoals.includes(goal)
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-[var(--border-default)] hover:border-gray-200 dark:hover:border-gray-600 text-[var(--text-secondary)]"
                      )}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-[var(--text-primary)]">Preferred language?</h2>
                  <p className="text-[var(--text-secondary)]">We speak your language, literally.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between",
                        language === lang.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-[var(--border-default)] hover:border-gray-200 dark:hover:border-gray-600 text-[var(--text-secondary)]"
                      )}
                    >
                      <span className="font-semibold text-lg">{lang.name}</span>
                      {language === lang.id && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your data is protected under DPDP guidelines. We never share your personal information.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex gap-4">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-4 px-6 rounded-2xl border-2 border-[var(--border-default)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 3 ? handleComplete : nextStep}
              className="flex-[2] py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {step === 3 ? 'Get Started' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
