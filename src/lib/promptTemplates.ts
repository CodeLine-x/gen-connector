export const RITE_OF_PASSAGE_PROMPTS = {
  childhood: [
    "What was your childhood home like? Can you describe the neighborhood where you grew up?",
    "What games or activities did you play as a child? What was your favorite toy or game?",
    "Tell me about your family - your parents, siblings, and what family gatherings were like.",
    "What was school like for you? Who were your friends and what did you do together?",
    "What traditions or celebrations did your family have when you were young?",
  ],
  "school-life": [
    "What was your school like? Can you describe your classroom and teachers?",
    "What subjects did you enjoy the most? What was challenging for you?",
    "Tell me about your school friends - who were they and what did you do together?",
    "What was a typical school day like for you? How did you get to school?",
    "What special events or activities do you remember from your school days?",
  ],
  "work-life": [
    "What was it like when you first started working? What was your first job?",
    "How did you choose your career path? What influenced your decision?",
    "What were the biggest challenges you faced in your work life?",
    "What achievements or moments at work are you most proud of?",
    "How did work-life balance look for you? How did you manage it?",
  ],
  relationships: [
    "How did you meet your closest friends or partner? What was your first impression?",
    "What makes a strong relationship in your opinion? What have you learned?",
    "Tell me about a relationship that significantly impacted your life.",
    "How did you navigate conflicts or challenges in your relationships?",
    "What advice would you give about building and maintaining relationships?",
  ],
  hobbies: [
    "What hobbies or activities did you enjoy most in your free time?",
    "How did you discover your favorite hobby? What drew you to it?",
    "Tell me about a memorable moment related to your hobbies.",
    "Did you share your hobbies with family or friends? How?",
    "How have your interests and hobbies changed over the years?",
  ],
  community: [
    "What was your neighborhood or community like? Can you describe it?",
    "How did people in your community help each other out?",
    "What community events or gatherings do you remember most fondly?",
    "Tell me about your neighbors - who stood out and why?",
    "How has your sense of community changed over the years?",
  ],
  // Legacy support for old routes (can be removed later if needed)
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
  return [...RITE_OF_PASSAGE_PROMPTS[riteOfPassage].slice(0, 3)];
}

export function getAllPrompts(riteOfPassage: RiteOfPassage): string[] {
  return [...RITE_OF_PASSAGE_PROMPTS[riteOfPassage]];
}
