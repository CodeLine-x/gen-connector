export const RITE_OF_PASSAGE_PROMPTS = {
  "birth-childhood": [
    "What was your childhood home like? Can you describe the neighborhood where you grew up?",
    "What games or activities did you play as a child? What was your favorite toy or game?",
    "Tell me about your family - your parents, siblings, and what family gatherings were like.",
    "What was school like for you? Who were your friends and what did you do together?",
    "What traditions or celebrations did your family have when you were young?",
  ],
  "coming-of-age": [
    "What was it like when you first started working? What was your first job?",
    "How did you meet your friends and what did you do for fun in your teenage years?",
    "What were the biggest challenges you faced as a young adult?",
    "What dreams or aspirations did you have when you were my age?",
    "How did you learn to be independent? What was that transition like?",
  ],
  marriage: [
    "How did you meet your spouse? What was your first impression of them?",
    "What was your wedding day like? Can you describe the ceremony and celebration?",
    "What advice would you give about choosing a life partner?",
    "How did your relationship change after getting married?",
    "What traditions or customs were important in your marriage?",
  ],
  death: [
    "How do you want to be remembered? What legacy do you hope to leave?",
    "What has given your life the most meaning and purpose?",
    "If you could give one piece of advice to future generations, what would it be?",
    "What are you most grateful for in your life?",
    "How do you hope your family will continue your traditions and values?",
  ],
} as const;

export type RiteOfPassage = keyof typeof RITE_OF_PASSAGE_PROMPTS;

export function getInitialPrompts(riteOfPassage: RiteOfPassage): string[] {
  return RITE_OF_PASSAGE_PROMPTS[riteOfPassage].slice(0, 3);
}

export function getAllPrompts(riteOfPassage: RiteOfPassage): string[] {
  return RITE_OF_PASSAGE_PROMPTS[riteOfPassage];
}
