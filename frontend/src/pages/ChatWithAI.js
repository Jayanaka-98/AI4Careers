import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatWithAI } from '../services/api';

function ChatWithAI() {
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                'Hi! I can use your uploaded resume and the career fair database to help with company matching, resume fit, and strategy. Try asking: "Which companies at this career fair are the best fit for my resume?"',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();

        const question = input.trim();
        if (!question || loading) {
            return;
        }

        const nextMessages = [...messages, { role: 'user', content: question }];
        setMessages(nextMessages);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const result = await chatWithAI(token, question, nextMessages);

            if (result.error) {
                throw new Error(result.details || result.error);
            }

            setMessages([
                ...nextMessages,
                {
                    role: 'assistant',
                    content: result.answer || 'I could not generate a response.',
                },
            ]);
        } catch (err) {
            setError(err.message || 'Failed to talk to AI.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-page">
            <nav className="navbar">
                <div className="nav-brand">
                    <h2>AI4Careers</h2>
                </div>
                <div className="nav-links">
                    <span className="user-name">{user ? `Hello, ${user.name}` : 'AI Chat'}</span>
                    <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </nav>

            <div className="chat-shell">
                <div className="chat-header-card">
                    <h1>Chat With AI</h1>
                    <p>
                        Ask about company fit, resume alignment, sponsorship constraints, locations,
                        or how to prioritize the career fair.
                    </p>
                </div>

                <div className="chat-window">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
                        >
                            <div className="chat-role">{msg.role === 'user' ? 'You' : 'AI'}</div>
                            <div className="chat-content">{msg.content}</div>
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-bubble chat-bubble-assistant">
                            <div className="chat-role">AI</div>
                            <div className="chat-content">Thinking...</div>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="chat-input-bar" onSubmit={handleSend}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your resume, best-fit companies, or how to prepare for the fair..."
                        rows={3}
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatWithAI;
