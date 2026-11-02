import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Menu,
  X,
  Sparkles,
  Bot,
  User,
  LoaderCircle,
  RefreshCw,
  Camera,
} from "lucide-react";
import { apiRequest } from "./api";
import "./ChatAssistant.css";

const suggestions = [
  "How can I build a simple skincare routine?",
  "Explain the layers of human skin.",
  "What causes acne?",
  "Help me understand skincare ingredients.",
];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ChatAssistant() {
  const [chats, setChats] = useState([]);
  const [retryText, setRetryText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const request = async (path, options = {}) => {
    if (!localStorage.getItem("dermalytixToken")) {
      throw new Error("Please log in again to use the AI Assistant.");
    }

    return apiRequest(path, options);
  };

  // Load conversations
  const loadChats = async () => {
    try {
      const data = await request("/chat/conversations");
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load conversations.");
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Clean up image preview and speech
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [imagePreview]);

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Image upload validation
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Convert image to Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Could not read image."));

      reader.readAsDataURL(file);
    });
  };

  // Start a new conversation
  const newChat = () => {
    stopSpeaking();
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setRetryText("");
    clearSelectedImage();
    setSidebarOpen(false);
  };

  // Open an existing conversation
  const openChat = async (id) => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const data = await request(
        `/chat/conversations/${id}/messages`
      );

      setConversationId(id);
      setMessages(Array.isArray(data) ? data : []);
      setRetryText("");
      clearSelectedImage();
      setSidebarOpen(false);
      stopSpeaking();
    } catch (err) {
      setError(err.message || "Unable to open conversation.");
    } finally {
      setLoading(false);
    }
  };

  // Text to speech
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  };

  // Send a message to the AI
  const sendMessage = async (text = input) => {
    const content = text.trim();

    if ((!content && !selectedImage) || loading) return;

    if (!localStorage.getItem("dermalytixToken")) {
      setError("Please log in again to use the AI Assistant.");
      return;
    }

    const imageBeingSent = selectedImage;

    setInput("");
    setError("");
    setRetryText(content);
    setLoading(true);

    try {
      let id = conversationId;

      // Create a new conversation when needed
      if (!id) {
        const conversation = await request(
          "/chat/conversations",
          {
            method: "POST",
            body: JSON.stringify({
              title: content
                ? content.slice(0, 60)
                : "Image conversation",
            }),
          }
        );

        id = conversation.id;
        setConversationId(id);
      }

      // Convert uploaded image
      const imageData = imageBeingSent
        ? await convertImageToBase64(imageBeingSent)
        : null;

      // Send message to backend
      const result = await request(
        `/chat/conversations/${id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content,
            image_data: imageData,
          }),
        }
      );

      if (!result.user_message || !result.assistant_message) {
        throw new Error("The AI returned an unexpected response.");
      }

      setMessages((previous) => [
        ...previous,
        result.user_message,
        result.assistant_message,
      ]);

      setRetryText("");
      clearSelectedImage();

      await loadChats();
    } catch (err) {
      setError(err.message || "Unable to send your message.");
      setInput(content);

      // Keep the selected image so the user can retry.
      if (imageBeingSent) {
        setSelectedImage(imageBeingSent);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete conversation
  const deleteChat = async (id, event) => {
    event.stopPropagation();

    if (loading) return;

    if (!window.confirm("Delete this conversation permanently?")) {
      return;
    }

    try {
      await request(`/chat/conversations/${id}`, {
        method: "DELETE",
      });

      setChats((previous) =>
        previous.filter((chat) => chat.id !== id)
      );

      if (conversationId === id) {
        newChat();
      }
    } catch (err) {
      setError(err.message || "Unable to delete conversation.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="derma-chat">
      {/* Sidebar */}
      <aside
        className={`chat-sidebar ${
          sidebarOpen ? "chat-sidebar-open" : ""
        }`}
      >
        <div className="chat-sidebar-top">
          <div className="chat-brand">
            <span className="chat-brand-icon">
              <Sparkles size={20} />
            </span>

            <span>
              Derma<span>Lytix</span> AI
            </span>
          </div>

          <button
            className="chat-icon-btn mobile-chat-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <button
          className="chat-new-btn"
          onClick={newChat}
          type="button"
        >
          <Plus size={19} />
          New chat
        </button>

        <p className="chat-history-label">
          YOUR CONVERSATIONS
        </p>

        <div className="chat-history-list">
          {loadingChats ? (
            <p className="chat-muted">
              Loading conversations...
            </p>
          ) : chats.length === 0 ? (
            <p className="chat-muted">
              Your conversations will appear here.
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-history-item ${
                  conversationId === chat.id ? "selected" : ""
                }`}
                onClick={() => openChat(chat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    openChat(chat.id);
                  }
                }}
              >
                <MessageCircle size={16} />

                <span>{chat.title}</span>

                <button
                  className="chat-delete-btn"
                  title="Delete conversation"
                  type="button"
                  onClick={(event) =>
                    deleteChat(chat.id, event)
                  }
                  aria-label="Delete conversation"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="chat-sidebar-footer">
          <div className="chat-footer-icon">
            <ShieldCheckIcon />
          </div>

          <div>
            <strong>Skin health matters</strong>
            <small>Learn. Understand. Care.</small>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="chat-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat */}
      <section className="chat-main">
        <header className="chat-topbar">
          <button
            className="chat-icon-btn mobile-chat-menu"
            onClick={() => setSidebarOpen(true)}
            type="button"
            aria-label="Open sidebar"
          >
            <Menu size={21} />
          </button>

          <div>
            <strong>AI Assistant</strong>
            <span>
              <i /> Online assistant
            </span>
          </div>

          <button
            className="chat-icon-btn"
            title="New conversation"
            onClick={newChat}
            type="button"
            aria-label="New conversation"
          >
            <Plus size={21} />
          </button>
        </header>

        <div className="chat-content">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <Sparkles size={30} />
              </div>

              <span className="chat-eyebrow">
                YOUR PERSONAL AI COMPANION
              </span>

              <h1>
                What can I help you <span>understand?</span>
              </h1>

              <p>
                Ask me about skin health, skincare, science,
                technology, studies or everyday questions.
              </p>

              <div className="chat-suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendMessage(item)}
                    disabled={loading}
                  >
                    <Sparkles size={16} />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-message-list">
              {messages.map((message) => (
                <div
                  className={`chat-message ${message.role}`}
                  key={message.id}
                >
                  <div className="chat-avatar">
                    {message.role === "assistant" ? (
                      <Bot size={19} />
                    ) : (
                      <User size={19} />
                    )}
                  </div>

                  <div className="chat-message-body">
                    <strong>
                      {message.role === "assistant"
                        ? "DermaLytix AI"
                        : "You"}
                    </strong>

                    <p>{message.content}</p>

                    {message.role === "assistant" && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            speakText(message.content)
                          }
                        >
                          Speak
                        </button>

                        {speaking && (
                          <button
                            type="button"
                            onClick={stopSpeaking}
                          >
                            Stop
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-message assistant">
                  <div className="chat-avatar">
                    <Bot size={19} />
                  </div>

                  <div className="chat-message-body">
                    <strong>DermaLytix AI</strong>

                    <p className="chat-thinking">
                      <LoaderCircle size={17} />
                      Thinking...
                    </p>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}

          {error && (
            <div className="chat-error">
              <span>{error}</span>

              {retryText && (
                <button
                  type="button"
                  onClick={() => sendMessage(retryText)}
                  disabled={loading}
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="chat-composer-area">
          {imagePreview && (
            <div className="chat-image-preview">
              <img
                src={imagePreview}
                alt="Selected upload"
              />

              <button
                type="button"
                onClick={clearSelectedImage}
                aria-label="Remove selected image"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form
            className="chat-composer"
            onSubmit={handleSubmit}
          >
            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="Ask anything about skin health or beyond..."
              rows={1}
              maxLength={8000}
              disabled={loading}
            />

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              onChange={handleImageSelect}
              hidden
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Upload image"
              title="Upload image"
            >
              <Camera size={20} />
            </button>

            <button
              type="submit"
              disabled={
                (!input.trim() && !selectedImage) || loading
              }
              aria-label="Send message"
              title="Send message"
            >
              <Send size={19} />
            </button>
          </form>

          <p className="chat-disclaimer">
            AI can make mistakes. Skin-health information is
            educational and is not a medical diagnosis.
          </p>
        </div>
      </section>
    </div>
  );
}

function ShieldCheckIcon() {
  return <Sparkles size={19} />;
}