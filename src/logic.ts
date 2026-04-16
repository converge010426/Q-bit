import { questions } from './questions.js';

export type MBTIType = 'INTJ' | 'INFJ' | 'ENTJ' | 'ENFJ' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'INTP' | 'INFP' | 'ENTP' | 'ENFP' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface AssessmentResults {
  mbti: MBTIType;
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
  };
  ei: {
    selfAwareness: number;
    selfRegulation: number;
    motivation: number;
    empathy: number;
    socialSkills: number;
  };
}

export function calculateResults(answers: Record<number, number>): AssessmentResults {
  const scores: Record<string, number[]> = {};

  questions.forEach(q => {
    if (!scores[q.dimension]) scores[q.dimension] = [];
    const answer = answers[q.id] || 3;
    const normalizedAnswer = q.direction === 1 ? answer : 6 - answer;
    scores[q.dimension].push(normalizedAnswer);
  });

  const avg = (dim: string) => {
    const vals = scores[dim] || [3];
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // MBTI Logic
  const E_I = avg('E') > avg('I') ? 'E' : 'I';
  const S_N = avg('S') > avg('N') ? 'S' : 'N';
  const T_F = avg('T') > avg('F') ? 'T' : 'F';
  const J_P = avg('J') > avg('P') ? 'J' : 'P';

  const mbti = `${E_I}${S_N}${T_F}${J_P}` as MBTIType;

  // Big Five Percentiles (Simulated mapping from 1-5 scale to 0-100)
  const toPercentile = (val: number) => Math.round(((val - 1) / 4) * 100);

  return {
    mbti,
    bigFive: {
      openness: toPercentile(avg('O')),
      conscientiousness: toPercentile(avg('C')),
      extraversion: toPercentile(avg('E')),
      agreeableness: toPercentile(avg('A')),
      emotionalStability: toPercentile(6 - avg('N_BF')), // Invert Neuroticism for Stability
    },
    ei: {
      selfAwareness: toPercentile(avg('EI_SA')),
      selfRegulation: toPercentile(avg('EI_SR')),
      motivation: toPercentile(avg('EI_MO')),
      empathy: toPercentile(avg('EI_EM')),
      socialSkills: toPercentile(avg('EI_SS')),
    }
  };
}

export const typeDescriptions: Record<MBTIType, { 
  title: string, 
  subtitle: string, 
  description: string,
  strengths: string[],
  challenges: string[],
  workplace: string,
  growth: string
}> = {
  INTJ: {
    title: "The Architect",
    subtitle: "The Mastermind",
    description: "INTJs are natural long-range thinkers. Where others see a problem, you see a system. Where others react to the present, you are already three moves ahead, running scenarios, testing assumptions, stress-testing outcomes. This is not something you choose to do – it is simply how your mind organises reality.",
    strengths: ["Strategic planning", "Logical problem-solving", "High independence", "Systemic thinking"],
    challenges: ["Perfectionism", "Impatience with inefficiency", "Over-analyzing social situations", "Difficulty with emotional expression"],
    workplace: "Thrives in environments that reward innovation and autonomous strategic work. Prefers merit-based systems over social hierarchies.",
    growth: "Focus on developing interpersonal empathy and recognizing the value of 'good enough' to avoid analysis paralysis."
  },
  INFJ: {
    title: "The Advocate",
    subtitle: "The Idealist",
    description: "INFJs have an inborn sense of idealism and morality, but what sets them apart is that they are not idle dreamers. They are people capable of taking concrete steps to realize their goals and make a lasting positive impact.",
    strengths: ["Deep empathy", "Visionary thinking", "Strong values", "Insightful communication"],
    challenges: ["Burnout from over-extending", "Sensitivity to criticism", "Difficulty opening up", "Perfectionism"],
    workplace: "Excels in roles that align with their personal mission and allow for deep, meaningful connection with others.",
    growth: "Practice setting healthy boundaries and acknowledging that you cannot solve everyone's problems."
  },
  ENTJ: {
    title: "The Commander",
    subtitle: "The Strategist",
    description: "ENTJs are natural-born leaders. People with this personality type embody the gifts of charisma and confidence, and exercise authority in a way that draws crowds together behind a common goal.",
    strengths: ["Strategic leadership", "Decisiveness", "Efficiency", "Confidence"],
    challenges: ["Intolerance", "Arrogance", "Poor handling of emotions", "Coldness"],
    workplace: "Dominates in high-stakes environments where clear goals and decisive action are required.",
    growth: "Learn to value the emotional input of others and understand that consensus can sometimes be more effective than command."
  },
  ENFJ: {
    title: "The Protagonist",
    subtitle: "The Giver",
    description: "ENFJs are natural-born leaders, full of passion and charisma. They are often found in roles where they can guide others to grow and improve.",
    strengths: ["Inspirational", "Reliable", "Charismatic", "Altruistic"],
    challenges: ["Overly idealistic", "Too sensitive", "Fluctuating self-esteem", "Struggle with tough decisions"],
    workplace: "Thrives in collaborative environments where they can mentor others and foster community.",
    growth: "Recognize that you cannot please everyone and that conflict is sometimes necessary for progress."
  },
  ISTJ: {
    title: "The Logistician",
    subtitle: "The Inspector",
    description: "ISTJs are defined by their integrity, practical logic, and tireless dedication to duty. They are the backbone of many organizations.",
    strengths: ["Honest and direct", "Strong-willed", "Responsible", "Calm and practical"],
    challenges: ["Stubborn", "Insensitive", "Always by the book", "Often judge others"],
    workplace: "Best suited for structured environments where accuracy, reliability, and tradition are valued.",
    growth: "Try to be more open to new, unconventional ideas and understand that rules sometimes need flexibility."
  },
  ISFJ: {
    title: "The Defender",
    subtitle: "The Protector",
    description: "ISFJs are true altruists, meeting kindness with kindness-in-excess and engaging the work and people they believe in with enthusiasm and generosity.",
    strengths: ["Supportive", "Reliable", "Observant", "Hard-working"],
    challenges: ["Humble to a fault", "Take things personally", "Repress feelings", "Overload themselves"],
    workplace: "Excels in supportive roles where they can provide practical help and maintain order.",
    growth: "Learn to advocate for your own needs and accept credit for your hard work."
  },
  ESTJ: {
    title: "The Executive",
    subtitle: "The Guardian",
    description: "ESTJs are representatives of tradition and order, utilizing their understanding of what is right, wrong and socially acceptable to bring families and communities together.",
    strengths: ["Dedicated", "Strong-willed", "Direct and honest", "Excellent organizers"],
    challenges: ["Inflexible", "Uncomfortable with unconventional situations", "Judgmental", "Too focused on social status"],
    workplace: "Thrives in leadership roles that require clear structure, accountability, and results.",
    growth: "Practice patience with those who have different working styles and be more open to change."
  },
  ESFJ: {
    title: "The Consul",
    subtitle: "The Provider",
    description: "ESFJs are social creatures who thrive on staying up to date with what their friends are doing. They are supportive and outgoing.",
    strengths: ["Strong practical skills", "Strong sense of duty", "Very loyal", "Sensitive and warm"],
    challenges: ["Worried about social status", "Inflexible", "Reluctant to innovate", "Too selfless"],
    workplace: "Best in roles that involve direct interaction with people and require high levels of cooperation.",
    growth: "Develop a thicker skin regarding criticism and learn to make decisions based on logic rather than just social harmony."
  },
  INTP: {
    title: "The Logician",
    subtitle: "The Thinker",
    description: "INTPs pride themselves on their inventiveness and creativity, their unique perspective and vigorous intellect.",
    strengths: ["Analytical", "Original", "Open-minded", "Enthusiastic"],
    challenges: ["Absent-minded", "Condescending", "Loathe rules and guidelines", "Second-guess themselves"],
    workplace: "Thrives in theoretical or creative roles that allow for deep independent analysis and problem-solving.",
    growth: "Work on translating your complex ideas into actionable steps and improving your interpersonal communication."
  },
  INFP: {
    title: "The Mediator",
    subtitle: "The Idealist",
    description: "INFPs are true idealists, always looking for the hint of good in even the worst of people and events, searching for ways to make things better.",
    strengths: ["Idealistic", "Seek harmony", "Open-minded", "Creative"],
    challenges: ["Too idealistic", "Too altruistic", "Impractical", "Dislike dealing with data"],
    workplace: "Best in creative or service-oriented roles that align with their personal values and allow for self-expression.",
    growth: "Focus on developing practical skills to ground your idealism and learn to handle conflict more directly."
  },
  ENTP: {
    title: "The Debater",
    subtitle: "The Visionary",
    description: "ENTPs are the ultimate devil's advocate, thriving on the process of shredding arguments and beliefs and letting the ribbons drift in the wind for all to see.",
    strengths: ["Knowledgeable", "Quick thinker", "Original", "Excellent brainstormer"],
    challenges: ["Very argumentative", "Insensitive", "Intolerant", "Can find it difficult to focus"],
    workplace: "Excels in roles that require constant innovation, strategic thinking, and challenging the status quo.",
    growth: "Learn to follow through on your ideas and be more mindful of how your debating style affects others' feelings."
  },
  ENFP: {
    title: "The Campaigner",
    subtitle: "The Champion",
    description: "ENFPs are true free spirits. They are often the life of the party, but unlike types in the Explorer role group, they are less interested in the sheer excitement and pleasure of the moment than they are in enjoying the social and emotional connections they make with others.",
    strengths: ["Curious", "Observant", "Energetic", "Excellent communicator"],
    challenges: ["Poor practical skills", "Find it difficult to focus", "Overthink things", "Get stressed easily"],
    workplace: "Thrives in creative, people-oriented environments where they can explore new ideas and inspire others.",
    growth: "Work on your organizational skills and learn to prioritize tasks to avoid becoming overwhelmed."
  },
  ISTP: {
    title: "The Virtuoso",
    subtitle: "The Craftsman",
    description: "ISTPs love to explore with their hands and their eyes, touching and examining the world around them with cool rationalism and spirited curiosity.",
    strengths: ["Optimistic and energetic", "Creative and practical", "Prioritize", "Great in a crisis"],
    challenges: ["Stubborn", "Insensitive", "Private and reserved", "Easily bored"],
    workplace: "Best in hands-on, technical, or analytical roles that offer variety and immediate problem-solving.",
    growth: "Try to be more communicative about your thoughts and plans to avoid isolating yourself from your team."
  },
  ISFP: {
    title: "The Adventurer",
    subtitle: "The Artist",
    description: "ISFPs are true artists, but not necessarily in the conventional sense where they’re out painting happy little trees. Often enough though, they are perfectly capable of that.",
    strengths: ["Charming", "Sensitive to others", "Imaginative", "Passionate"],
    challenges: ["Fierce independence", "Unpredictable", "Easily stressed", "Overly competitive"],
    workplace: "Excels in creative or practical roles that allow for personal expression and a flexible schedule.",
    growth: "Work on long-term planning and learn to handle criticism as a tool for growth rather than a personal attack."
  },
  ESTP: {
    title: "The Entrepreneur",
    subtitle: "The Dynamo",
    description: "ESTPs always have an impact on their immediate surroundings – the best way to spot them at a party is to look for the eddy of people flitting about them as they move from group to group.",
    strengths: ["Bold", "Rational and practical", "Direct", "Sociable"],
    challenges: ["Insensitive", "Impatient", "Risk-prone", "Unstructured"],
    workplace: "Thrives in fast-paced, action-oriented environments that require quick thinking and social influence.",
    growth: "Learn to consider the long-term consequences of your actions and be more mindful of others' emotional boundaries."
  },
  ESFP: {
    title: "The Entertainer",
    subtitle: "The Performer",
    description: "ESFPs get caught up in the excitement of the moment, and want everyone else to feel that way, too. No other personality type is as generous with their time and energy when it comes to encouraging others.",
    strengths: ["Bold", "Original", "Aesthetics and showmanship", "Practical"],
    challenges: ["Sensitive", "Conflict-averse", "Easily bored", "Poor long-term planners"],
    workplace: "Best in roles that involve direct interaction with people and allow them to use their social skills and creativity.",
    growth: "Work on your focus and long-term planning skills to ensure your enthusiasm leads to sustainable results."
  }
};
