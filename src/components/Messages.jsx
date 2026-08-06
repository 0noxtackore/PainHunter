import { useEffect, useRef } from 'react';
import Message from './Message';

export default function Messages({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
