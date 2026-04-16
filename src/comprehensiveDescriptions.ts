export interface ComprehensiveDescription {
  introduction: string;
  strengths: string[];
  challenges: string[];
  workplace: {
    asLeader: string;
    asColleague: string;
    asSubordinate: string;
  };
  growth: string[];
}

export const comprehensiveDescriptions: Record<string, ComprehensiveDescription> = {
  "INTJ": {
    introduction: "INTJs are analytical, strategic, and highly independent individuals who excel at seeing the big picture and developing long-term plans. Often referred to as 'The Architect' or 'The Strategist,' they possess a unique blend of creativity and logic, allowing them to solve complex problems with innovative solutions. Driven by a thirst for knowledge and a commitment to excellence, INTJs are constantly seeking ways to improve themselves and the systems around them. They value competence and efficiency above all else and are not afraid to challenge the status quo if they believe there is a better way to do things.",
    strengths: [
      "Strategic Thinking: Exceptional ability to see the big picture and anticipate future trends and possibilities.",
      "Analytical Problem-Solving: Highly logical and objective approach to solving complex problems.",
      "Independence and Self-Reliance: Strong sense of autonomy and the ability to work effectively on their own.",
      "Commitment to Excellence: High standards for themselves and others, always striving for the best possible results.",
      "Innovative and Creative: Ability to think outside the box and develop unique solutions to challenges.",
      "Determined and Persistent: Strong will and the drive to see projects through to completion, even in the face of obstacles."
    ],
    challenges: [
      "Perfectionism: Can be overly critical of themselves and others, leading to frustration and stress.",
      "Difficulty with Emotions: May struggle to understand or express their own emotions and can be seen as cold or detached by others.",
      "Impatience with Inefficiency: Can become frustrated with people or systems that they perceive as slow or incompetent.",
      "Overly Analytical: May spend too much time analyzing a situation and struggle to make a decision or take action.",
      "Difficulty with Social Nuances: May find small talk and social conventions tedious and struggle to build rapport with others.",
      "Arrogance: Can sometimes come across as condescending or dismissive of others' ideas if they believe they are superior."
    ],
    workplace: {
      asLeader: "As leaders, INTJs are visionary and strategic, focusing on long-term goals and efficiency. They value competence and results above all else and expect their team members to be as dedicated and capable as they are. They are not afraid to make difficult decisions and are always looking for ways to improve processes and systems. However, they may struggle with the more 'human' side of leadership, such as providing emotional support or building team morale.",
      asColleague: "As colleagues, INTJs are reliable, efficient, and highly competent. They prefer to work independently but are willing to collaborate if they believe it will lead to a better result. They value logic and reason and can be direct and honest in their feedback, which some may find off-putting. They are not big on small talk and prefer to focus on the task at hand.",
      asSubordinate: "As subordinates, INTJs are highly capable and self-motivated. They work best when given clear goals and the autonomy to achieve them in their own way. They value competence in their managers and will respect those who demonstrate a deep understanding of their field. However, they may struggle with managers who are overly controlling or who they perceive as incompetent."
    },
    growth: [
      "Develop Emotional Intelligence: Work on understanding and expressing your own emotions and being more empathetic towards others.",
      "Practice Patience: Learn to be more patient with people and systems that are not as efficient or logical as you would like.",
      "Improve Communication Skills: Focus on communicating your ideas in a way that is more accessible and less intimidating to others.",
      "Learn to Delegate: Trust others to handle tasks and resist the urge to do everything yourself.",
      "Seek Feedback: Be open to feedback from others and use it as an opportunity for growth and self-improvement.",
      "Balance Analysis with Action: Recognize when you have enough information to make a decision and take action, rather than getting stuck in 'analysis paralysis'."
    ]
  }
  // Other types will be added as needed or can use a generic template for now.
};
