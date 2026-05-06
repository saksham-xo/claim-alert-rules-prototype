import { useState } from 'react';
import { X, ChevronDown, Plus, Trash2, Check } from 'lucide-react';
import { SEGMENTS, RULE_ATTRIBUTES, RULE_OPERATORS } from '../data/engageData';
import Donut from '../components/shared/Donut';

const STEPS = ['Segment Selection', 'Campaign Rules', 'Review & Save'];

export default function CreateCampaign({ onClose }) {
  const [step, setStep] = useState(0);
  const [segmentId, setSegmentId] = useState('');
  const [rules, setRules] = useState([{ id: 1, attr: '', op: '', val: '', reward: '' }]);
  const [capping, setCapping] = useState('No Capping');
  const [cappingValue, setCappingValue] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedSeg = SEGMENTS.find((s) => s.id === segmentId);
  const memberPct = selectedSeg ? Math.round((selectedSeg.memberCount / selectedSeg.totalMembers) * 100) : 0;

  const addRule = () => setRules((prev) => [...prev, { id: Date.now(), attr: '', op: '', val: '', reward: '' }]);
  const removeRule = (id) => setRules((prev) => prev.filter((r) => r.id !== id));
  const updateRule = (id, field, value) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const canProceed = () => {
    if (step === 0) return !!segmentId;
    if (step === 1) return rules.every((r) => r.attr && r.op && r.val && r.reward) && !!periodStart && !!periodEnd;
    return !!campaignName.trim();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
        <div className="bg-surface rounded-xl p-10 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#E6F9EC] flex items-center justify-center">
            <Check size={32} className="text-[#1A7F37]" />
          </div>
          <div className="text-[18px] font-semibold text-text">Campaign Created!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] w-full mx-auto my-8 bg-surface rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
            <span className="text-[18px] font-semibold text-text">Create Campaign</span>
            <button onClick={onClose} className="text-text-secondary hover:text-text cursor-pointer"><X size={20} /></button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-5 border-b border-border-soft">
            <div className="flex items-center gap-0">
              {STEPS.map((label, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold border-2 shrink-0 ${
                        done ? 'bg-primary border-primary text-white' :
                        active ? 'border-primary text-primary bg-white' :
                        'border-border text-text-muted bg-white'
                      }`}>
                        {done ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`text-[13px] ${active ? 'text-primary font-medium' : done ? 'text-text' : 'text-text-muted'}`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${done ? 'bg-primary' : 'bg-border-soft'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="p-6 flex-1">
            {step === 0 && (
              <Step1
                segmentId={segmentId}
                setSegmentId={setSegmentId}
                selectedSeg={selectedSeg}
                memberPct={memberPct}
              />
            )}
            {step === 1 && (
              <Step2
                rules={rules}
                addRule={addRule}
                removeRule={removeRule}
                updateRule={updateRule}
                capping={capping}
                setCapping={setCapping}
                cappingValue={cappingValue}
                setCappingValue={setCappingValue}
                periodStart={periodStart}
                setPeriodStart={setPeriodStart}
                periodEnd={periodEnd}
                setPeriodEnd={setPeriodEnd}
              />
            )}
            {step === 2 && (
              <Step3
                campaignName={campaignName}
                setCampaignName={setCampaignName}
                selectedSeg={selectedSeg}
                rules={rules}
                capping={capping}
                cappingValue={cappingValue}
                periodStart={periodStart}
                periodEnd={periodEnd}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-soft flex items-center justify-between">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="border border-border text-text-secondary rounded px-5 py-2 text-[14px] cursor-pointer hover:bg-surface-soft"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              disabled={!canProceed()}
              onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : handleSave()}
              className={`rounded px-6 py-2 text-[14px] font-medium cursor-pointer ${
                canProceed()
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-border text-text-muted cursor-not-allowed'
              }`}
            >
              {step === STEPS.length - 1 ? 'Save Campaign' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1({ segmentId, setSegmentId, selectedSeg, memberPct }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-[15px] font-semibold text-text mb-1">Select Segment</div>
        <div className="text-[13px] text-text-secondary mb-3">Choose the member segment this campaign will target</div>
        <div className="relative">
          <select
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
            className="w-full border border-border rounded px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary appearance-none bg-surface pr-8 cursor-pointer"
          >
            <option value="">Select a segment…</option>
            {SEGMENTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.memberCount.toLocaleString()} members)</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {selectedSeg && (
        <div className="border border-border-soft rounded-lg p-5 flex items-center gap-8">
          <div className="shrink-0">
            <Donut
              success={memberPct}
              fail={0}
              size={120}
              label={`${memberPct}%`}
              labelSub="coverage"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[18px] font-semibold text-text">{selectedSeg.name}</div>
              <div className="text-[12px] text-text-secondary mt-0.5">{selectedSeg.behaviour} segment</div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[13px]">
              <MetaLine label="Members in segment" value={`${selectedSeg.memberCount.toLocaleString()} / ${selectedSeg.totalMembers.toLocaleString()}`} />
              <MetaLine label="Active campaigns" value={selectedSeg.campaignCount} />
              <MetaLine label="Created on" value={selectedSeg.createdOn} />
              <MetaLine label="Behaviour" value={selectedSeg.behaviour} />
            </div>
            {selectedSeg.memberFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeg.memberFilters.map((f, i) => (
                  <span key={i} className="text-[12px] px-2 py-0.5 rounded bg-primary-soft text-primary">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaLine({ label, value }) {
  return (
    <div>
      <span className="text-text-secondary">{label}: </span>
      <span className="text-text font-medium">{value}</span>
    </div>
  );
}

function Step2({ rules, addRule, removeRule, updateRule, capping, setCapping, cappingValue, setCappingValue, periodStart, setPeriodStart, periodEnd, setPeriodEnd }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Rules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[15px] font-semibold text-text">Campaign Rules</div>
            <div className="text-[13px] text-text-secondary">Define IF/THEN conditions for point accrual</div>
          </div>
          <button
            onClick={addRule}
            className="flex items-center gap-1 text-[13px] text-primary border border-primary rounded px-3 py-1.5 cursor-pointer hover:bg-primary-soft"
          >
            <Plus size={13} /> Add Rule
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="border border-border-soft rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Rule {idx + 1}</span>
                {rules.length > 1 && (
                  <button onClick={() => removeRule(rule.id)} className="text-danger hover:bg-surface-soft p-1 rounded cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-text-secondary w-6">IF</span>
                  <Sel value={rule.attr} onChange={(v) => updateRule(rule.id, 'attr', v)} options={RULE_ATTRIBUTES} placeholder="Attribute…" />
                  <Sel value={rule.op} onChange={(v) => updateRule(rule.id, 'op', v)} options={RULE_OPERATORS} placeholder="Operator…" />
                  <input
                    value={rule.val}
                    onChange={(e) => updateRule(rule.id, 'val', e.target.value)}
                    placeholder="Value…"
                    className="flex-1 border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-text-secondary w-6">THEN</span>
                  <span className="text-[13px] text-text-secondary">Points Accrued is</span>
                  <input
                    type="number"
                    value={rule.reward}
                    onChange={(e) => updateRule(rule.id, 'reward', e.target.value)}
                    placeholder="e.g. 10"
                    className="w-28 border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capping */}
      <div className="border border-border-soft rounded-lg p-4">
        <div className="text-[14px] font-semibold text-text mb-3">Capping</div>
        <div className="flex items-center gap-6">
          {['No Capping', 'Set Capping'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setCapping(opt)}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                  capping === opt ? 'border-primary' : 'border-border'
                }`}
              >
                {capping === opt && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px] text-text">{opt}</span>
            </label>
          ))}
          {capping === 'Set Capping' && (
            <input
              type="number"
              value={cappingValue}
              onChange={(e) => setCappingValue(e.target.value)}
              placeholder="Max points…"
              className="border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary w-36"
            />
          )}
        </div>
      </div>

      {/* Campaign Period */}
      <div className="border border-border-soft rounded-lg p-4">
        <div className="text-[14px] font-semibold text-text mb-3">Campaign Period</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[12px] text-text-secondary block mb-1">Start Date</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-[12px] text-text-secondary block mb-1">End Date</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary appearance-none bg-surface pr-7 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  );
}

function Step3({ campaignName, setCampaignName, selectedSeg, rules, capping, cappingValue, periodStart, periodEnd }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Campaign Name */}
      <div>
        <label className="text-[14px] font-semibold text-text block mb-1.5">Campaign Name</label>
        <input
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="Enter a name for this campaign…"
          className="w-full border border-border rounded px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary"
        />
      </div>

      {/* Campaign Information */}
      <div className="border border-border-soft rounded-lg overflow-hidden">
        <div className="bg-surface-soft px-4 py-3 border-b border-border-soft text-[14px] font-semibold text-text">Campaign Information</div>
        <div className="px-4 py-4 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
          <ReviewLine label="Segment" value={selectedSeg?.name ?? '—'} />
          <ReviewLine label="Start Date" value={periodStart || '—'} />
          <ReviewLine label="End Date" value={periodEnd || '—'} />
          <ReviewLine label="Capping" value={capping === 'Set Capping' && cappingValue ? `Max ${cappingValue} pts` : 'No Capping'} />
          <ReviewLine label="Total Rules" value={`${rules.length} rule${rules.length !== 1 ? 's' : ''}`} />
        </div>
      </div>

      {/* Rules summary */}
      <div className="border border-border-soft rounded-lg overflow-hidden">
        <div className="bg-surface-soft px-4 py-3 border-b border-border-soft text-[14px] font-semibold text-text">Campaign Rules</div>
        <div className="divide-y divide-border-soft">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="px-4 py-3 text-[13px]">
              <span className="text-text-secondary font-medium">Rule {idx + 1}: </span>
              <span className="text-text">IF </span>
              <span className="text-primary font-medium">{rule.attr || '?'}</span>
              <span className="text-text"> {rule.op || '?'} {rule.val || '?'}</span>
              <span className="text-text"> → Points: </span>
              <span className="text-text font-semibold">{rule.reward || '?'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewLine({ label, value }) {
  return (
    <div>
      <span className="text-text-secondary">{label}: </span>
      <span className="text-text font-medium">{value}</span>
    </div>
  );
}
