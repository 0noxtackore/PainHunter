import Avatar from './Avatar';

function UserMessage({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-brand-500/20 sm:max-w-[70%]">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content, streaming }) {
  const empty = streaming && content.length === 0;
  return (
    <div className="flex items-start gap-3">
      <Avatar size="sm" />
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-slate-200 border-l-4 border-l-brand-500 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm sm:max-w-[70%]">
        {empty ? (
          <span className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: `${dot * 0.15}s` }}
              />
            ))}
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

export default function Message({ message }) {
  return message.role === 'user' ? (
    <UserMessage content={message.content} />
  ) : (
    <AssistantMessage content={message.content} streaming={message.streaming} />
  );
}
