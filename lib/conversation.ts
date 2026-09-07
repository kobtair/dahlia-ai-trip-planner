export type ConversationMessage = {
  role: 'You' | 'Dahlia';
  text: string;
  questions?: string[];
};

export function appendConversationTurn(
  history: ConversationMessage[],
  userText: string,
  assistantText: string,
  questions: string[],
  limit = 24,
) {
  return [
    ...history,
    { role: 'You' as const, text: userText },
    { role: 'Dahlia' as const, text: assistantText, questions: [...questions] },
  ].slice(-limit);
}
