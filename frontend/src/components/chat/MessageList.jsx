import { useChatStore } from '../../stores/chatStore'
import Message from './Message'
import ThinkingAnimation from './ThinkingAnimation'

export default function MessageList({ isLoading }) {
    const messages = useChatStore(state => state.messages)

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden px-1 sm:px-0">
            {messages.map((message) => (
                <Message key={message.id} message={message} />
            ))}
            {isLoading && <ThinkingAnimation />}
        </div>
    )
}
