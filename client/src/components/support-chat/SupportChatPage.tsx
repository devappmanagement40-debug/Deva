import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, ImagePlus, LoaderCircle, Paperclip, Send, X } from "lucide-react";
import { useLocation } from "wouter";
import customerServiceIcon from "@assets/customer-service-icon-512.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SupportChatMessage } from "@shared/schema";
import "./support-chat.css";

type UploadResult = {
  url: string;
  type: "image" | "video" | "file";
  mimeType: string;
  name: string;
};

type SendBody = {
  message: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video" | "file";
  attachmentName?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.";
}

function formatTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function MessageAttachment({ item }: { item: SupportChatMessage }) {
  if (!item.attachmentUrl || !item.attachmentType) return null;
  if (item.attachmentType === "image") {
    return (
      <a className="sc-attachment" href={item.attachmentUrl} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${item.attachmentName || "l’image jointe"}`}>
        <img src={item.attachmentUrl} alt={item.attachmentName || "Image jointe"} loading="lazy" />
      </a>
    );
  }
  if (item.attachmentType === "video") {
    return (
      <video className="sc-attachment" controls preload="metadata" aria-label={item.attachmentName || "Vidéo jointe"}>
        <source src={item.attachmentUrl} />
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
    );
  }
  return (
    <a className="sc-attachment" href={item.attachmentUrl} target="_blank" rel="noreferrer" download={item.attachmentName || undefined}>
      <span className="sc-attachment-file"><FileText size={17} aria-hidden="true" /> <span className="sc-attachment-name">{item.attachmentName || "Fichier joint"}</span></span>
    </a>
  );
}

function MessageRow({ item, own }: { item: SupportChatMessage; own: boolean }) {
  return (
    <div className="sc-message-row" data-own={own} data-testid={`message-${item.id}`}>
      {!own && (
        <span className="sc-message-avatar" aria-hidden="true">
          <img src={customerServiceIcon} alt="" />
        </span>
      )}
      <div className="sc-message-stack">
        <div className="sc-bubble">
          <MessageAttachment item={item} />
          {item.message && <span>{item.message}</span>}
        </div>
        <time className="sc-message-time" dateTime={new Date(item.createdAt).toISOString()}>{formatTime(item.createdAt)}</time>
      </div>
    </div>
  );
}

export default function SupportChatPage() {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const [sendingError, setSendingError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  const messagesQuery = useQuery<SupportChatMessage[]>({
    queryKey: ["/api/support-chat/messages"],
    queryFn: async () => {
      const response = await fetch("/api/support-chat/messages", { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Impossible de charger la conversation.");
      }
      return response.json();
    },
    refetchInterval: 3000,
    staleTime: 0,
  });
  const messages = messagesQuery.data || [];

  const sendMessage = useMutation({
    mutationFn: async ({ text, file }: { text: string; file?: File }) => {
      let attachment: UploadResult | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("/api/support-chat/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const body = await uploadResponse.json().catch(() => null);
          throw new Error(body?.message || "Le fichier n’a pas pu être téléversé.");
        }
        attachment = await uploadResponse.json();
        if (!attachment?.url || !attachment?.type) {
          throw new Error("La réponse du téléversement est invalide.");
        }
      }
      const body: SendBody = {
        message: text,
        ...(attachment ? {
          attachmentUrl: attachment.url,
          attachmentType: attachment.type,
          attachmentName: attachment.name || file?.name,
        } : {}),
      };
      const response = await apiRequest("POST", "/api/support-chat/messages", body);
      return response.json() as Promise<SupportChatMessage>;
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      setFilePreviewUrl("");
      setValidationError("");
      setSendingError("");
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["/api/support-chat/messages"] });
    },
    onError: (error: Error) => setSendingError(error.message || "Votre message n’a pas pu être envoyé."),
  });

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setFilePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    const newest = messages[messages.length - 1];
    if (!newest || newest.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = newest.id;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setValidationError("");
    setSendingError("");
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setValidationError("Le fichier dépasse la taille maximale de 10 Mo.");
      input.value = "";
      return;
    }
    setSelectedFile(file);
    input.value = "";
  };

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage && !selectedFile) return;
    setSendingError("");
    setValidationError("");
    sendMessage.mutate({ text: cleanMessage, file: selectedFile || undefined });
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };
  const canSend = (message.trim().length > 0 || !!selectedFile) && !sendMessage.isPending;

  return (
    <main className="sc-page" data-testid="support-chat-page">
      <section className="sc-chat-shell" aria-label="Conversation avec le support DIAMANT">
        <header className="sc-topbar">
          <button className="sc-icon-button" type="button" onClick={() => navigate("/service")} aria-label="Retour" data-testid="button-support-back">
            <ArrowLeft size={21} aria-hidden="true" />
          </button>
          <h1>Centre d’aide</h1>
          <span className="sc-topbar-spacer" aria-hidden="true" />
        </header>

        <div className="sc-support-banner">
          <span className="sc-support-avatar"><img src={customerServiceIcon} alt="" /></span>
          <div className="sc-support-copy">
            <strong>DIAMANT</strong>
            <span>Écrivez-nous à tout moment</span>
          </div>
        </div>

        <section className="sc-message-area" aria-label="Messages" aria-live="polite" data-testid="support-message-list">
          {messagesQuery.isLoading && (
            <div className="sc-thread-state" role="status">
              <div className="sc-state-card">
                <div className="sc-skeleton" style={{ width: 180 }} />
                <div className="sc-skeleton" style={{ width: 230 }} />
                <p>Chargement de votre conversation…</p>
              </div>
            </div>
          )}
          {messagesQuery.isError && (
            <div className="sc-thread-state" role="alert">
              <div className="sc-state-card">
                <strong>La conversation n’est pas disponible</strong>
                <p>{getErrorMessage(messagesQuery.error)}</p>
                <button type="button" className="sc-retry" onClick={() => void messagesQuery.refetch()} data-testid="button-retry-support-messages">Réessayer</button>
              </div>
            </div>
          )}
          {!messagesQuery.isLoading && !messagesQuery.isError && messages.length === 0 && (
            <div className="sc-thread-state">
              <div className="sc-state-card">
                <strong>Votre équipe DIAMANT vous répond ici</strong>
                <p>Écrivez-nous pour toute question sur votre compte ou vos opérations.</p>
              </div>
            </div>
          )}
          {messages.map((item) => (
            <MessageRow key={item.id} item={item} own={item.senderRole === "user"} />
          ))}
          <div ref={messageEndRef} />
        </section>

        <form className="sc-composer" onSubmit={handleSend} aria-label="Écrire un message">
          {selectedFile && (
            <div className="sc-attachment-preview" data-testid="support-attachment-preview">
              {selectedFile.type.startsWith("image/") ? (
                <img src={filePreviewUrl} alt="" />
              ) : <FileText size={19} aria-hidden="true" />}
              <span className="sc-preview-name">{selectedFile.name}</span>
              <button
                type="button"
                className="sc-preview-remove"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreviewUrl("");
                  if (imageInputRef.current) imageInputRef.current.value = "";
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Retirer la pièce jointe"
                data-testid="button-remove-support-attachment"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          )}
          {validationError && <p className="sc-upload-error" role="alert" data-testid="support-validation-error">{validationError}</p>}
          {sendingError && <p className="sc-send-error" role="alert" data-testid="support-send-error">{sendingError}</p>}
          <div className="sc-compose-line">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Votre message..."
              aria-label="Votre message"
              rows={1}
              maxLength={2000}
              data-testid="input-support-message"
            />
            <button
              className="sc-tool-button"
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={sendMessage.isPending}
              aria-label="Choisir une image dans la galerie"
              data-testid="button-support-attach"
            >
              <ImagePlus size={23} aria-hidden="true" />
            </button>
            <button
              className="sc-tool-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessage.isPending}
              aria-label="Joindre un fichier"
              data-testid="button-support-file"
            >
              <Paperclip size={23} aria-hidden="true" />
            </button>
            <button
              className="sc-send-button"
              type="submit"
              disabled={!canSend}
              aria-label={sendMessage.isPending ? "Envoi en cours" : "Envoyer le message"}
              data-testid="button-support-send"
            >
              {sendMessage.isPending ? <LoaderCircle size={19} className="animate-spin" aria-hidden="true" /> : <Send size={19} aria-hidden="true" />}
            </button>
          </div>
          <input
            ref={imageInputRef}
            className="sc-hidden-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            aria-label="Choisir une image dans la galerie"
            tabIndex={-1}
            data-testid="input-support-image"
          />
          <input
            ref={fileInputRef}
            className="sc-hidden-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,.pdf"
            onChange={handleFileChange}
            aria-label="Sélectionner une pièce jointe"
            tabIndex={-1}
            data-testid="input-support-file"
          />
        </form>
      </section>
    </main>
  );
}