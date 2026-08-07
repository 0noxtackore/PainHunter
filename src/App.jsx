import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { usePageTitle } from './hooks/usePageTitle';
import { loadWhisper } from './services/whisperService';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import GamificationBar from './components/GamificationBar';
import Messages from './components/Messages';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadWhisper().catch(() => {});
  }, []);

  const {
    conversations,
    activeConversationId,
    messages,
    notas,
    loading,
    gamification,
    gamificationPending,
    sendMessage,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useChat();

  usePageTitle('Chat');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar
        onNewChat={() => {
          startNewChat();
          closeSidebar();
        }}
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={(id) => {
          selectConversation(id);
          closeSidebar();
        }}
        onDelete={deleteConversation}
        onRename={renameConversation}
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="h-1 shrink-0 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700" />
        <div className="relative flex h-20 shrink-0 items-center justify-center border-b border-white/10 bg-gradient-to-r from-brand-700 to-brand-900 px-4 md:hidden">
          <img src="/img/logo_menubar.png" alt="PainHunter" className="mx-auto h-8 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="h-12 shrink-0 bg-transparent md:hidden" />
        <ChatHeader notas={notas} />
        <GamificationBar gamification={gamification} pending={gamificationPending} />
        {messages.length > 0 ? (
          <Messages messages={messages} loading={loading} />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <WelcomeScreen onPick={sendMessage} />
          </div>
        )}
        <ChatInput onSend={sendMessage} disabled={loading} />
      </main>
    </div>
  );
}
