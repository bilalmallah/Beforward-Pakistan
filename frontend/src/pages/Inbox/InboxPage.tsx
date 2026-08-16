import { useEffect, useState } from 'react';
import { Search, Send, FileText } from 'lucide-react';
import clsx from 'clsx';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useSocket from '../../hooks/useSocket';
import type { ConversationListItem, ConversationDetail } from './inboxApi';
import {
  listConversations,
  getConversation,
  sendMessage,
  markConversationRead,
} from './inboxApi';
import TemplateSendDialog from './TemplateSendDialog';

function isWindowOpen(conversation: ConversationDetail | ConversationListItem | null): boolean {
  if (!conversation?.customerServiceWindowExpiresAt) return false;
  return new Date(conversation.customerServiceWindowExpiresAt).getTime() > Date.now();
}

export default function InboxPage() {
  const socket = useSocket();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  function reloadList() {
    listConversations({ search: search || undefined }).then((res) => setConversations(res.data));
  }

  useEffect(() => {
    const timeout = setTimeout(reloadList, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    getConversation(selectedId).then(setSelected);
    markConversationRead(selectedId).then(reloadList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!socket) return;
    const onMessageNew = (payload: { conversationId: string }) => {
      reloadList();
      if (payload.conversationId === selectedId) {
        getConversation(payload.conversationId).then(setSelected);
      }
    };
    const onConversationUpdated = () => reloadList();

    socket.on('message:new', onMessageNew);
    socket.on('conversation:updated', onConversationUpdated);
    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('conversation:updated', onConversationUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, selectedId]);

  async function handleSend() {
    if (!selectedId || !draft.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(selectedId, draft.trim());
      setDraft('');
      const refreshed = await getConversation(selectedId);
      setSelected(refreshed);
    } catch {
      // Window-closed / validation errors surface via the composer's disabled state below;
      // a toast system lands with the broader notifications module (spec section 42).
    } finally {
      setIsSending(false);
    }
  }

  const windowOpen = isWindowOpen(selected);

  return (
    <div className="flex h-[calc(100vh-4rem-3rem)] gap-0 overflow-hidden rounded-lg border border-ink-300/60 bg-white">
      {/* Conversation list */}
      <div className="flex w-80 shrink-0 flex-col border-r border-ink-300/60">
        <div className="border-b border-ink-300/60 p-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-center text-sm text-ink-500">No conversations.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={clsx(
                'flex w-full flex-col gap-1 border-b border-ink-300/40 px-4 py-3 text-left transition-colors',
                selectedId === c.id ? 'bg-brand-50' : 'hover:bg-ink-100/60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-900">{c.customer.companyName}</span>
                <span
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    c.status === 'ACTIVE' ? 'bg-success-500' : 'bg-ink-300'
                  )}
                  title={c.status}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>{c.customer.country ?? c.customer.whatsappNumber ?? '—'}</span>
                {c.unreadCount > 0 && (
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 font-medium text-white">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col">
        {!selected && (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-500">
            Select a conversation to view messages.
          </div>
        )}

        {selected && (
          <>
            <div className="flex items-center justify-between border-b border-ink-300/60 px-5 py-3">
              <div>
                <div className="font-medium text-ink-900">{selected.customer.companyName}</div>
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full',
                      selected.status === 'ACTIVE' ? 'bg-success-500' : 'bg-ink-300'
                    )}
                  />
                  {selected.status === 'ACTIVE' ? 'Active' : selected.status === 'INACTIVE' ? 'Inactive' : 'New'}
                </div>
              </div>
              <Button variant="secondary" onClick={() => setShowTemplateDialog(true)}>
                <FileText size={16} />
                Template
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto bg-ink-100/30 p-5">
              <div className="flex flex-col gap-3">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx('flex', m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={clsx(
                        'max-w-md rounded-lg px-4 py-2 text-sm shadow-sm',
                        m.direction === 'OUTBOUND'
                          ? 'bg-brand-600 text-white'
                          : 'border border-ink-300/60 bg-white text-ink-900'
                      )}
                    >
                      <p>{m.body}</p>
                      <p
                        className={clsx(
                          'mt-1 text-right text-[10px]',
                          m.direction === 'OUTBOUND' ? 'text-brand-100' : 'text-ink-500'
                        )}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-ink-300/60 p-3">
              {windowOpen ? (
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    rows={2}
                    className="flex-1 rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button onClick={handleSend} isLoading={isSending} disabled={!draft.trim()}>
                    <Send size={16} />
                  </Button>
                </div>
              ) : (
                <Card className="border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    The customer-service window is closed. Free-form messaging is unavailable —
                    send an approved template instead.
                  </p>
                  <Button variant="secondary" className="mt-2" onClick={() => setShowTemplateDialog(true)}>
                    <FileText size={16} />
                    Choose a template
                  </Button>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {selectedId && showTemplateDialog && (
        <TemplateSendDialog
          conversationId={selectedId}
          onClose={() => setShowTemplateDialog(false)}
          onSent={() => {
            if (selectedId) getConversation(selectedId).then(setSelected);
            reloadList();
          }}
        />
      )}
    </div>
  );
}
