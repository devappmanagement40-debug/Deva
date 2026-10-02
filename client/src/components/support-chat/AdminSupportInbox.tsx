import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Inbox, LoaderCircle, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SupportChatConversation, SupportChatMessage } from "@shared/schema";
import "./support-chat.css";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}

function shortTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function fullTime(value: string | Date): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toLocaleUpperCase("fr-FR");
}

function ThreadMessage({ item, memberName }: { item: SupportChatMessage; memberName: string }) {
  const own = item.senderRole === "admin";
  return (
    <div className="sc-message-row" data-own={own} data-testid={`admin-message-${item.id}`}>
      {!own && <span className="sc-person-mark" aria-hidden="true">{initials(memberName)}</span>}
      <div className="sc-message-stack">
        <div className="sc-bubble">
          {item.attachmentUrl && item.attachmentType === "image" && (
            <a className="sc-attachment" href={item.attachmentUrl} target="_blank" rel="noreferrer">
              <img src={item.attachmentUrl} alt={item.attachmentName || "Image jointe"} loading="lazy" />
            </a>
          )}
          {item.attachmentUrl && item.attachmentType === "video" && (
            <video className="sc-attachment" controls preload="metadata" aria-label={item.attachmentName || "Vidéo jointe"}>
              <source src={item.attachmentUrl} />
              Votre navigateur ne peut pas lire cette vidéo.
            </video>
          )}
          {item.attachmentUrl && item.attachmentType === "file" && (
            <a className="sc-attachment" href={item.attachmentUrl} target="_blank" rel="noreferrer" download={item.attachmentName || undefined}>
              <span className="sc-attachment-file"><FileText size={16} aria-hidden="true" /><span className="sc-attachment-name">{item.attachmentName || "Fichier joint"}</span></span>
            </a>
          )}
          {item.message && <span>{item.message}</span>}
        </div>
        <time className="sc-message-time" dateTime={new Date(item.createdAt).toISOString()}>{fullTime(item.createdAt)}</time>
      </div>
    </div>
  );
}

export default function AdminSupportInbox() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  const conversationsQuery = useQuery<SupportChatConversation[]>({
    queryKey: ["/api/admin/support-chat/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/support-chat/conversations", { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger les conversations.");
      }
      return response.json();
    },
    refetchInterval: 5000,
    staleTime: 0,
  });
  const conversations = conversationsQuery.data || [];

  const activeConversation = conversations.find((conversation) => conversation.user.id === selectedUserId);
  const threadQuery = useQuery<SupportChatMessage[]>({
    queryKey: ["/api/admin/support-chat/conversations", selectedUserId, "messages"],
    queryFn: async () => {
      if (selectedUserId === null) return [];
      const response = await fetch(`/api/admin/support-chat/conversations/${selectedUserId}/messages`, { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger les messages.");
      }
      return response.json();
    },
    enabled: selectedUserId !== null,
    refetchInterval: selectedUserId === null ? false : 3000,
    staleTime: 0,
  });
  const thread = threadQuery.data || [];

  const sendReply = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/admin/support-chat/conversations/${userId}/messages`, { message });
      return response.json() as Promise<SupportChatMessage>;
    },
    onSuccess: () => {
      setDraft("");
      setSendError("");
      if (selectedUserId !== null) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations", selectedUserId, "messages"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations"] });
    },
    onError: (error: Error) => setSendError(error.message || "La réponse n’a pas pu être envoyée."),
  });

  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [selectedUserId]);

  useEffect(() => {
    const newest = thread[thread.length - 1];
    if (!newest || newest.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = newest.id;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  const submitReply = (event?: FormEvent) => {
    event?.preventDefault();
    const cleanDraft = draft.trim();
    if (!selectedUserId || !cleanDraft || sendReply.isPending) return;
    setSendError("");
    sendReply.mutate({ userId: selectedUserId, message: cleanDraft });
  };

  const onDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitReply();
    }
  };

  const unreadTotal = conversations.reduce((total, item) => total + item.unreadCount, 0);

  return (
    <section className="sc-admin" data-testid="admin-support-inbox">
      <div className="sc-admin-heading">
        <div>
          <h2>Messages du support</h2>
          <p>Répondez aux membres depuis leur conversation DIAMANT.</p>
        </div>
      </div>
      <div className="sc-admin-shell" data-thread-open={selectedUserId !== null}>
        <aside className="sc-inbox" aria-label="Liste des conversations">
          <div className="sc-inbox-title">
            <strong>Conversations</strong>
            <span aria-label={`${unreadTotal} messages non lus`}>{unreadTotal}</span>
          </div>
          {conversationsQuery.isLoading ? (
            <div aria-label="Chargement des conversations" role="status">
              <div className="sc-skeleton" />
              <div className="sc-skeleton" />
              <div className="sc-skeleton" />
            </div>
          ) : conversationsQuery.isError ? (
            <div className="sc-admin-empty" role="alert">
              <div>
                <p>{errorMessage(conversationsQuery.error)}</p>
                <button className="sc-retry" type="button" onClick={() => void conversationsQuery.refetch()}>Réessayer</button>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="sc-admin-empty">
              <div><Inbox size={24} aria-hidden="true" /><p>Aucune conversation pour le moment.</p></div>
            </div>
          ) : (
            <div className="sc-conversation-list">
              {conversations.map((conversation) => {
                const preview = conversation.lastMessage?.attachmentType
                  ? conversation.lastMessage.message || "Pièce jointe"
                  : conversation.lastMessage?.message || "Aucun message";
                return (
                  <button
                    key={conversation.user.id}
                    type="button"
                    className="sc-conversation-button"
                    data-selected={selectedUserId === conversation.user.id}
                    onClick={() => {
                      setSelectedUserId(conversation.user.id);
                      setSendError("");
                    }}
                    aria-current={selectedUserId === conversation.user.id ? "true" : undefined}
                    data-testid={`button-support-conversation-${conversation.user.id}`}
                  >
                    <span className="sc-person-mark">{initials(conversation.user.fullName)}</span>
                    <span className="sc-person-copy">
                      <strong>{conversation.user.fullName}</strong>
                      <span>{conversation.user.phone} · {conversation.user.country}</span>
                      <span className="sc-person-last">{conversation.lastMessage?.senderRole === "admin" ? "Vous : " : ""}{preview}</span>
                    </span>
                    <span className="sc-conversation-meta">
                      {conversation.lastMessage?.createdAt && <time>{shortTime(conversation.lastMessage.createdAt)}</time>}
                      {conversation.unreadCount > 0 && <span className="sc-unread" aria-label={`${conversation.unreadCount} non lus`}>{conversation.unreadCount}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="sc-admin-thread" aria-label="Conversation sélectionnée">
          {activeConversation ? (
            <>
              <header className="sc-admin-thread-head">
                <button
                  className="sc-admin-back"
                  type="button"
                  onClick={() => setSelectedUserId(null)}
                  aria-label="Retour à la liste des conversations"
                  data-testid="button-support-inbox-back"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <span className="sc-person-mark">{initials(activeConversation.user.fullName)}</span>
                <div>
                  <h3>{activeConversation.user.fullName}</h3>
                  <p>{activeConversation.user.phone} · {activeConversation.user.country}</p>
                </div>
              </header>

              <div className="sc-admin-messages" aria-label={`Messages avec ${activeConversation.user.fullName}`} aria-live="polite" data-testid="admin-support-message-list">
                {threadQuery.isLoading ? (
                  <div className="sc-thread-state" role="status"><div className="sc-state-card"><div className="sc-skeleton" /><p>Chargement des messages…</p></div></div>
                ) : threadQuery.isError ? (
                  <div className="sc-thread-state" role="alert">
                    <div className="sc-state-card">
                      <strong>Impossible d’ouvrir cette conversation</strong>
                      <p>{errorMessage(threadQuery.error)}</p>
                      <button className="sc-retry" type="button" onClick={() => void threadQuery.refetch()}>Réessayer</button>
                    </div>
                  </div>
                ) : thread.length === 0 ? (
                  <div className="sc-thread-state"><div className="sc-state-card"><strong>Début de la conversation</strong><p>Envoyez une réponse au membre.</p></div></div>
                ) : thread.map((item) => <ThreadMessage key={item.id} item={item} memberName={activeConversation.user.fullName} />)}
                <div ref={messageEndRef} />
              </div>

              <form className="sc-admin-composer" onSubmit={submitReply}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onDraftKeyDown}
                  placeholder="Écrire une réponse..."
                  aria-label="Votre réponse"
                  maxLength={2000}
                  data-testid="input-admin-support-reply"
                />
                <button
                  className="sc-admin-send"
                  type="submit"
                  disabled={!draft.trim() || sendReply.isPending}
                  data-testid="button-admin-support-send"
                >
                  {sendReply.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  <span>Envoyer</span>
                </button>
              </form>
              {sendError && <p className="sc-admin-error" role="alert" data-testid="admin-support-send-error">{sendError}</p>}
            </>
          ) : (
            <div className="sc-admin-empty">
              <div><Inbox size={27} aria-hidden="true" /><p>Sélectionnez une conversation pour consulter les messages et répondre.</p></div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}