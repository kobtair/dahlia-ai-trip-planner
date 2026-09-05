'use client';
import { useState } from 'react';

const questions = [
  ['destination', 'Where would you like to go?', 'text'],
  ['origin', 'Where will you be traveling from?', 'text'],
  ['startDate', 'When would you like to leave?', 'date'],
  ['endDate', 'And when will your trip end?', 'date'],
  ['travelers', 'How many people are traveling?', 'number'],
  ['currency', 'Which currency should we use?', 'currency'],
  ['budget', 'What is your total trip budget for everyone? Leave blank for no limit.', 'number'],
  ['pace', 'What pace feels right for this trip?', 'pace'],
] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'];
export function TripConversation({ onConfirm }: { onConfirm: (answers: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(-1);
  const [value, setValue] = useState('');
  const question = questions[step];
  const done = step === questions.length;
  return <section className="mx-auto max-w-xl px-5 py-16">
    <p className="planner-eyebrow">LET’S PLAN SOMETHING GOOD</p>
    <h1 className="mt-5 font-heading text-5xl">Where are you dreaming of?</h1>
    <p className="mt-4 text-sm text-muted-foreground">Tell me about the trip you have in mind. We’ll work out the details together.</p>
    {step >= 0 && <div className="mt-8 space-y-4" aria-live="polite"><p className="rounded-xl bg-white p-4 text-sm">{answers.prompt}</p>{questions.slice(0, step).map(([key, label]) => <div key={key} className="text-sm"><p className="text-muted-foreground">{label}</p><p className="mt-1 font-medium">{answers[key] || 'No limit'}</p></div>)}<p className="font-medium">{done ? 'Does this look right? Confirm below, or go back to change a detail.' : question?.[1]}</p></div>}
    {done ? <div className="mt-6 flex gap-3"><button className="rounded-lg bg-primary px-5 py-3 text-primary-foreground" onClick={() => onConfirm(answers)}>Confirm trip details →</button><button onClick={() => { setStep(step - 1); setValue(answers.pace); }}>Go back</button></div> : <form className="mt-6" onSubmit={(event) => {
      event.preventDefault();
      const key = question?.[0] || 'prompt';
      const nextAnswers = { ...answers, [key]: value.trim() };
      const match = step === -1 ? value.trim().match(/\b(?:go|travel|fly|head)\s+(?:to|for)\s+([A-Za-z][A-Za-z\s'-]*?)(?=\s+(?:from|on|in|for)\b|[,!.]|$)/i) : null;
      if (match?.[1]) nextAnswers.destination = match[1].trim();
      setAnswers(nextAnswers);
      const nextStep = step === -1 ? (match?.[1] ? 1 : 0) : step + 1;
      setStep(nextStep);
      setValue(questions[nextStep]?.[2] === 'currency' ? 'USD' : questions[nextStep]?.[2] === 'pace' ? 'balanced' : '');
    }}>
      <div className="flex gap-2 rounded-xl border bg-white p-3">
        {question?.[2] === 'currency' || question?.[2] === 'pace' ? <select aria-label={question[1]} className="conversation-field min-w-0 flex-1 bg-transparent p-2" value={value} onChange={(event) => setValue(event.target.value)}>{(question[2] === 'currency' ? CURRENCIES : ['slow', 'balanced', 'full']).map((option) => <option key={option}>{option}</option>)}</select> : <input key={step} aria-label={question?.[1] || 'Describe your trip'} className="conversation-field min-w-0 flex-1 p-2 outline-none" type={question?.[2] || 'text'} placeholder={step < 0 ? 'A week in Italy, good food and time to wander…' : 'Your answer…'} value={value} onChange={(event) => setValue(event.target.value)} required={question?.[0] !== 'budget'} min={question?.[0] === 'endDate' ? answers.startDate : question?.[0] === 'travelers' ? 1 : 0} max={question?.[0] === 'travelers' ? 12 : undefined} />}
        <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" type="submit">Send →</button>
      </div>
      {step >= 0 && <button type="button" className="mt-3 text-xs text-muted-foreground" onClick={() => { setStep(step - 1); setValue(answers[questions[step - 1]?.[0] || 'prompt'] || ''); }}>Go back</button>}
    </form>}
  </section>;
}
