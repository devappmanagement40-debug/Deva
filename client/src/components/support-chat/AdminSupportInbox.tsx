import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, FileText, ImagePlus, Inbox, LoaderCircle, Pencil, Send, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { SupportChatConversation, SupportChatMessage } from "@shared/schema";
import "./support-chat.css";

type SupportChatUploadResult = {
  url: string;
  type: "image";
  name: string;
};

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

type ThreadMessageProps = {
  item: SupportChatMessage;
  memberName: string;
  canEdit: boolean;
  isEditing: boolean;
  editDraft: string;
  isSavingEdit: boolean;
  editError: string;
  onStartEdit: () => void;
  onEditDraftChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (event: FormEvent<HTMLFormElement>) => void;
};

function ThreadMessage({
  item,
  memberName,
  canEdit,
  isEditing,
  editDraft,
  isSavingEdit,
  editError,
  onStartEdit,
  onEditDraftChange,
  onCancelEdit,
  onSaveEdit,
}: ThreadMessageProps) {
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
          {isEditing ? (
            <form className="sc-admin-edit-form" onSubmit={onSaveEdit}>
              <textarea
                value={editDraft}
                onChange={(event) => onEditDraftChange(event.target.value)}
                aria-label="Modifier le message envoyé"
                maxLength={2000}
                rows={3}
                autoFocus
                data-testid={`input-edit-admin-message-${item.id}`}
              />
              <div className="sc-admin-edit-actions">
                <button type="button" onClick={onCancelEdit} disabled={isSavingEdit} data-testid={`button-cancel-edit-${item.id}`}>
                  <X size={15} aria-hidden="true" />
                  <span>Annuler</span>
                </button>
                <button type="submit" disabled={!editDraft.trim() || isSavingEdit} data-testid={`button-save-edit-${item.id}`}>
                  {isSavingEdit ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                  <span>Enregistrer</span>
                </button>
              </div>
              {editError && <p className="sc-admin-edit-error" role="alert">{editError}</p>}
            </form>
          ) : item.message ? (
            <span>{item.message}</span>
          ) : null}
        </div>
        {canEdit && !isEditing && (
          <button
            className="sc-admin-edit-trigger"
            type="button"
            onClick={onStartEdit}
            aria-label="Modifier mon message"
            data-testid={`button-edit-admin-message-${item.id}`}
          >
            <Pencil size={13} aria-hidden="true" />
            <span>Modifier</span>
          </button>
        )}
        <time className="sc-message-time" dateTime={new Date(item.createdAt).toISOString()}>{fullTime(item.createdAt)}</time>
      </div>
    </div>
  );
}

export default function AdminSupportInbox() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [threadView, setThreadView] = useState<"messages" | "images">("messages");
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
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
    mutationFn: async ({ userId, message, image }: { userId: number; message: string; image?: File }) => {
      let attachment: SupportChatUploadResult | undefined;
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadResponse = await fetch("/api/support-chat/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const body = await uploadResponse.json().catch(() => null);
          throw new Error(body?.message || "L’image n’a pas pu être téléversée.");
        }
        const uploaded = await uploadResponse.json();
        if (uploaded?.type !== "image" || typeof uploaded.url !== "string" || typeof uploaded.name !== "string") {
          throw new Error("La réponse du téléversement est invalide.");
        }
        attachment = uploaded as SupportChatUploadResult;
      }

      const response = await apiRequest("POST", `/api/admin/support-chat/conversations/${userId}/messages`, {
        message,
        ...(attachment ? {
          attachmentUrl: attachment.url,
          attachmentType: attachment.type,
          attachmentName: attachment.name || image?.name,
        } : {}),
      });
      return response.json() as Promise<SupportChatMessage>;
    },
    onSuccess: (_message, variables) => {
      if (selectedUserId === variables.userId) {
        setDraft("");
        setSelectedImage(null);
        setSendError("");
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations", variables.userId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations"] });
    },
    onError: (error: Error, variables) => {
      if (selectedUserId === variables.userId) {
        setSendError(error.message || "La réponse n’a pas pu être envoyée.");
      }
    },
  });

  const editReply = useMutation({
    mutationFn: async ({ userId, messageId, message }: { userId: number; messageId: number; message: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/support-chat/conversations/${userId}/messages/${messageId}`,
        { message },
      );
      return response.json() as Promise<SupportChatMessage>;
    },
    onSuccess: (_updatedMessage, variables) => {
      setEditingMessageId(null);
      setEditDraft("");
      setEditError("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations", variables.userId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-chat/conversations"] });
    },
    onError: (error: Error) => setEditError(error.message || "Le message n’a pas pu être modifié."),
  });

  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  useEffect(() => {
    const newest = thread[thread.length - 1];
    if (!newest || newest.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = newest.id;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  const submitReply = (event?: FormEvent) => {
    event?.preventDefault();
    const cleanDraft = draft.trim();
    if (selectedUserId === null || (!cleanDraft && !selectedImage) || sendReply.isPending) return;
    setSendError("");
    sendReply.mutate({ userId: selectedUserId, message: cleanDraft, image: selectedImage || undefined });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const image = input.files?.[0];
    input.value = "";
    if (!image) return;

    setSendError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
      setSelectedImage(null);
      setSendError("Formats d’image acceptés : JPG, PNG, WebP ou GIF.");
      return;
    }
    if (image.size > 10 * 1024 * 1024) {
      setSelectedImage(null);
      setSendError("L’image dépasse la taille maximale de 10 Mo.");
      return;
    }
    setSelectedImage(image);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSendError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitReply();
    }
  };

  const unreadTotal = conversations.reduce((total, item) => total + item.unreadCount, 0);
  const imageMessages = thread.filter((item) => item.attachmentUrl && item.attachmentType === "image");

  const startEditing = (item: SupportChatMessage) => {
    setEditingMessageId(item.id);
    setEditDraft(item.message);
    setEditError("");
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditDraft("");
    setEditError("");
  };

  const saveEditedMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = editDraft.trim();
    if (selectedUserId === null || editingMessageId === null || !message || editReply.isPending) return;
    setEditError("");
    editReply.mutate({ userId: selectedUserId, messageId: editingMessageId, message });
  };

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
                      if (selectedUserId !== conversation.user.id) {
                        setDraft("");
                        setSelectedImage(null);
                        setSendError("");
                        if (imageInputRef.current) imageInputRef.current.value = "";
                      }
                      setSelectedUserId(conversation.user.id);
                      setThreadView("messages");
                      cancelEditing();
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
                  onClick={() => {
                    setSelectedUserId(null);
                    setThreadView("messages");
                    cancelEditing();
                  }}
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

              <div className="sc-admin-thread-tabs" aria-label="Contenu de la conversation">
                <button
                  type="button"
                  aria-pressed={threadView === "messages"}
                  data-active={threadView === "messages"}
                  onClick={() => setThreadView("messages")}
                  data-testid="button-support-view-messages"
                >
                  Messages
                </button>
                <button
                  type="button"
                  aria-pressed={threadView === "images"}
                  data-active={threadView === "images"}
                  onClick={() => {
                    setThreadView("images");
                    cancelEditing();
                  }}
                  data-testid="button-support-view-images"
                >
                  Images <span>{imageMessages.length}</span>
                </button>
              </div>

              {threadView === "images" ? (
                <div className="sc-admin-gallery" aria-label={`Images échangées avec ${activeConversation.user.fullName}`} data-testid="admin-support-image-gallery">
                  {threadQuery.isLoading ? (
                    <div className="sc-thread-state" role="status"><div className="sc-state-card"><div className="sc-skeleton" /><p>Chargement des images…</p></div></div>
                  ) : threadQuery.isError ? (
                    <div className="sc-thread-state" role="alert">
                      <div className="sc-state-card">
                        <strong>Impossible de charger les images</strong>
                        <p>{errorMessage(threadQuery.error)}</p>
                        <button className="sc-retry" type="button" onClick={() => void threadQuery.refetch()}>Réessayer</button>
                      </div>
                    </div>
                  ) : imageMessages.length === 0 ? (
                    <div className="sc-thread-state"><div className="sc-state-card"><strong>Aucune image partagée</strong><p>Les images envoyées dans cette conversation apparaîtront ici.</p></div></div>
                  ) : (
                    <div className="sc-admin-gallery-grid">
                      {imageMessages.map((item) => (
                        <figure className="sc-admin-gallery-item" key={item.id}>
                          <a href={item.attachmentUrl || undefined} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${item.attachmentName || "l’image partagée"}`}>
                            <img src={item.attachmentUrl || undefined} alt={item.attachmentName || "Image partagée"} loading="lazy" />
                          </a>
                          <figcaption>
                            <span>{item.attachmentName || "Image partagée"}</span>
                            <time>{shortTime(item.createdAt)}</time>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
                  ) : thread.map((item) => (
                    <ThreadMessage
                      key={item.id}
                      item={item}
                      memberName={activeConversation.user.fullName}
                      canEdit={item.senderRole === "admin" && item.senderId === user?.id}
                      isEditing={editingMessageId === item.id}
                      editDraft={editDraft}
                      isSavingEdit={editReply.isPending && editingMessageId === item.id}
                      editError={editingMessageId === item.id ? editError : ""}
                      onStartEdit={() => startEditing(item)}
                      onEditDraftChange={setEditDraft}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEditedMessage}
                    />
                  ))}
                  <div ref={messageEndRef} />
                </div>
              )}

              <form className="sc-admin-composer" onSubmit={submitReply}>
                {selectedImage && (
                  <div className="sc-attachment-preview" data-testid="admin-support-attachment-preview">
                    <img src={imagePreviewUrl} alt="" />
                    <span className="sc-preview-name">{selectedImage.name}</span>
                    <button
                      type="button"
                      className="sc-preview-remove"
                      onClick={removeSelectedImage}
                      disabled={sendReply.isPending}
                      aria-label="Retirer l’image jointe"
                      data-testid="button-remove-admin-support-image"
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  </div>
                )}
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
                  className="sc-tool-button"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={sendReply.isPending}
                  aria-label="Joindre une image"
                  data-testid="button-admin-support-attach-image"
                >
                  <ImagePlus size={21} aria-hidden="true" />
                </button>
                <button
                  className="sc-admin-send"
                  type="submit"
                  disabled={(!draft.trim() && !selectedImage) || sendReply.isPending}
                  data-testid="button-admin-support-send"
                >
                  {sendReply.isPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  <span>Envoyer</span>
                </button>
                <input
                  ref={imageInputRef}
                  className="sc-hidden-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  aria-label="Choisir une image à envoyer"
                  tabIndex={-1}
                  data-testid="input-admin-support-image"
                />
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