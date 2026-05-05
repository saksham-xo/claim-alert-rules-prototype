import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Settings, MoreHorizontal, Eye, Pencil, Trash2, Info, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore, eventLabel, CHANNELS } from '../data/store';
import Toggle from '../components/shared/Toggle';
import ChannelPill, { EmptyChannelsPill } from '../components/shared/ChannelPill';
import Modal from '../components/shared/Modal';

export default function Communication() {
  const navigate = useNavigate();
  const { templates, toggleEnabled, deleteTemplate, showToast } = useStore();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="bg-surface rounded-lg p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary">
          <MessageSquareText size={22} />
        </div>
        <div className="flex-1">
          <div className="text-[24px] font-semibold leading-9 text-text">Communication</div>
          <div className="text-[14px] text-text tracking-[0.25px]">Manage SMS, Email, WhatsApp and Push communication with ease</div>
        </div>
        <button className="flex items-center gap-2 border border-primary text-primary rounded-3xl px-5 py-2.5 text-[14px] font-medium hover:bg-primary-soft cursor-pointer">
          <Settings size={16} />
          Communication Settings
        </button>
      </div>

      {/* Manage Templates card */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-soft">
          <div className="text-[18px] font-semibold leading-7 text-text">Manage Templates</div>
          <button
            onClick={() => navigate('/communication/new')}
            className="bg-primary hover:bg-primary-hover text-white rounded text-[14px] font-medium px-5 py-2.5 cursor-pointer"
          >
            Create Template
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-soft border-b border-border-soft">
              <tr className="text-[14px] font-semibold text-text">
                <th className="w-[91px] py-4 px-7 text-left"></th>
                <th className="py-4 px-7 text-left">Template Name</th>
                <th className="py-4 px-7 text-left">Events</th>
                <th className="py-4 px-7 text-left">Active Channels</th>
                <th className="w-[120px] py-4 px-4 text-left">
                  <span className="inline-flex items-center gap-1">Total Sent <Info size={12} className="text-text-secondary" /></span>
                </th>
                <th className="w-[120px] py-4 px-4 text-left">Success Rate</th>
                <th className="w-[100px] py-4 px-7 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border-soft hover:bg-surface-soft/60 cursor-pointer"
                  onClick={() => navigate(`/communication/${t.id}`)}
                >
                  <td className="py-4 px-7" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={t.enabled} onChange={() => toggleEnabled(t.id)} />
                  </td>
                  <td className="py-4 px-7">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-text tracking-[0.25px]">{t.name}</span>
                      {t.sensitive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-email text-email text-[11px] font-medium">
                          Sensitive Data
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-7 text-[14px] text-text-muted tracking-[0.25px]">{eventLabel(t.event)}</td>
                  <td className="py-4 px-7">
                    {CHANNELS.some((c) => t.channels[c.id]) ? (
                      <div className="flex flex-wrap gap-1">
                        {CHANNELS.filter((c) => t.channels[c.id]).map((c) => (
                          <ChannelPill key={c.id} id={c.id} compact />
                        ))}
                      </div>
                    ) : (
                      <EmptyChannelsPill />
                    )}
                  </td>
                  <td className="py-4 px-4 text-[14px] text-text">{t.totalSent ?? 0}</td>
                  <td className="py-4 px-4 text-[14px] text-text">{t.totalSent ? `${t.successRate} %` : 0}</td>
                  <td className="py-4 px-7 text-center" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      open={openMenuId === t.id}
                      onOpen={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                      onClose={() => setOpenMenuId(null)}
                      onView={() => { setOpenMenuId(null); navigate(`/communication/${t.id}`); }}
                      onEdit={() => { setOpenMenuId(null); navigate(`/communication/${t.id}/edit`); }}
                      onDelete={() => { setOpenMenuId(null); setConfirmDelete(t); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination total={templates.length} />
      </div>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Template"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
              className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteTemplate(confirmDelete.id);
                showToast(`Template "${confirmDelete.name}" deleted.`);
                setConfirmDelete(null);
              }}
              className="bg-danger text-white rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="px-6 py-5 text-[14px] text-text">
          Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be undone.
        </div>
      </Modal>
    </div>
  );
}

function Pagination({ total }) {
  return (
    <div className="border-t border-border-soft px-6 py-3 flex items-center justify-end gap-6 text-[12px] text-text">
      <div className="flex items-center gap-2">
        <span className="text-text-secondary">Rows per page:</span>
        <button className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-surface-soft rounded cursor-pointer">
          10 <ChevronDown size={12} />
        </button>
      </div>
      <div>1-{total} of {total}</div>
      <div className="flex items-center gap-1 text-text-secondary">
        <button className="p-1 hover:bg-surface-soft rounded cursor-not-allowed opacity-40" disabled aria-label="Previous">
          <ChevronLeft size={16} />
        </button>
        <button className="p-1 hover:bg-surface-soft rounded cursor-not-allowed opacity-40" disabled aria-label="Next">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function RowActions({ open, onOpen, onClose, onView, onEdit, onDelete }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, onClose]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={onOpen}
        className="text-text-secondary hover:text-text cursor-pointer p-1 rounded hover:bg-surface-soft"
        aria-label="Row actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-10 text-left">
          <MenuItem icon={<Eye size={14} />} label="View" onClick={onView} />
          <MenuItem icon={<Pencil size={14} />} label="Edit" onClick={onEdit} />
          <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 text-[14px] cursor-pointer hover:bg-surface-soft ${
        danger ? 'text-danger' : 'text-text'
      }`}
    >
      {icon} {label}
    </button>
  );
}
