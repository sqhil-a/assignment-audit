import type { Source } from "../types/audit";
export const essayOriginal = `Industrialization and the Working Class: Progress at What Cost?

Introduction
In nineteenth-century Britain, industrialization moved production from small workshops to mechanized factories. Towns expanded as families sought paid work. These changes transformed the relationship between workers and employers. Although factory work created hardships, industrialization was the decisive force improving the lives of the British working class.

Economic change
Factory employment created more regular wages than seasonal agricultural work. The class source pack describes an increase in real wages over the later nineteenth century. This meant workers could purchase more goods. Industrialization therefore improved life for all workers.

Working conditions
The benefits came with costs. The 1832 Sadler Committee testimony in the source pack describes long hours, physical exhaustion, and injuries among young factory workers. Children worked under dangerous machinery. This shows factories were often dangerous places. The Factory Act of 1833 introduced limits on children's working hours and a system of factory inspection.

Urban life
Industrial towns attracted workers but struggled to provide safe housing and sanitation. The class notes describe overcrowding and contaminated water in fast-growing towns. Overcrowding contributed to disease. Later improvements in public health made conditions better. Workers also formed associations to press for change.

Conclusion
Industrialization changed working life in many ways. Wages rose, but factory conditions and housing could be poor. Overall, industrialization improved the lives of workers because it created opportunities. These changes continue to influence debates about whether economic growth should be judged by output or by people's lived experience.

Sources
Course source pack: Working Life in Industrial Britain. Class handout.
Lecture notes: Industrialization, reform, and public health. Class notes.`;
export const essayRevision = `Industrialization and the Working Class: Progress at What Cost?

Introduction
In nineteenth-century Britain, industrialization moved production from small workshops to mechanized factories. Towns expanded as families sought paid work. These changes transformed the relationship between workers and employers. Although industrialization expanded earning opportunities in the later nineteenth century, its early costs to health and autonomy meant that improvements in working-class life depended on regulation as well as economic growth.

Economic change
Factory employment created more regular wages than seasonal agricultural work. The class source pack describes an increase in real wages over the later nineteenth century. More purchasing power could improve access to goods, but aggregate wage gains do not establish that every worker benefited equally. For children facing injury and families living in unhealthy housing, income alone is an incomplete measure of progress. The balance therefore changes with the period and group being considered (Course source pack, Economic change).

Working conditions
The 1832 Sadler Committee testimony in the source pack describes long hours, physical exhaustion, and injuries among young factory workers. Read alongside the wage evidence, this suggests that increased production did not automatically produce greater wellbeing. Testimony gathered for a reform inquiry highlights serious harms, but may not represent every factory. The Factory Act of 1833 introduced limits on children's working hours and a system of factory inspection (Course source pack, Factory reform). An employer could argue that factories offered steadier income than agriculture. Yet this argument cannot dismiss harms that earnings alone could not remedy; regulation addressed a different dimension of workers' lives.

Urban life
Industrial towns attracted workers but struggled to provide safe housing and sanitation. The class notes describe overcrowding and contaminated water in fast-growing towns. Overcrowding contributed to disease. Later improvements in public health made conditions better. Workers also formed associations to press for change. By 1850, sanitation reform had eliminated most waterborne disease across industrial Britain.

Conclusion
Industrialization increased earning opportunities, but early gains were uneven and accompanied by serious costs. Improvements in working-class life depended on protections and infrastructure as well as growth.

Sources
Course source pack: Working Life in Industrial Britain. Class handout.
Lecture notes: Industrialization, reform, and public health. Class notes.`;
export const essayPolished = essayRevision
  .replace(
    "By 1850, sanitation reform had eliminated most waterborne disease across industrial Britain.",
    "The notes establish that sanitation reform developed gradually; they do not show that disease had been eliminated. This suggests that improvements in urban life depended on public infrastructure rather than factory growth alone (Lecture notes, Public health).",
  )
  .replace(
    "as well as growth.\n\nSources",
    "as well as growth. The experience therefore challenges the assumption that higher output is a sufficient measure of social progress.\n\nSources",
  );
export const rubricText = `Class essay rubric. Each criterion is assessed out of 8; this is an illustrative teaching rubric.
Knowledge and understanding: Demonstrate accurate, relevant knowledge of industrial Britain, with appropriate historical context. Top band: precise and well-selected knowledge that supports the argument.
Analysis and evaluation: Establish a defensible judgment about improvements in working-class life. Compare gains and costs, consider different groups and periods, evaluate evidence and alternative interpretations. Top band: sustained evaluation leading to a qualified judgment.
Organization: Use a focused thesis, coherent paragraphs, and a conclusion that follows from the argument. Top band: a purposeful structure and clear development of ideas.
Evidence and referencing: Integrate the supplied course sources, identify them consistently, and consider their limitations. Top band: evidence is traceable and used critically throughout. Exact visual citation formatting is not assessed from extracted text.`;
export const instructionsText = `Write an analytical response to: To what extent did industrialization improve the lives of the British working class?
1. State and sustain a clear, qualified judgment.
2. Consider economic change, working conditions, and urban life.
3. Include and evaluate an alternative interpretation or counterargument.
4. Use both the course source pack and lecture notes; cite the relevant source when you use it.
5. Explain what the evidence means for your judgment, rather than only describing it.
6. End with a conclusion on the wider significance of your argument.
No word limit is specified for this practice assignment.`;
export const feedbackText = `1. Your analysis needs to go beyond describing the evidence.
2. Consider whose lives improved, and when. Avoid treating the working class as a single group.
3. Acknowledge another interpretation before reaching your final judgment.
4. Make it possible to trace claims back to the course sources.`;
export function sampleMaterials(version = 1): Source[] {
  const make = (role: Source["role"], name: string, text: string): Source => ({
    id: `sample-${role}`,
    name,
    text,
    role,
    size: new TextEncoder().encode(text).length,
    type: "TXT",
    status: "ready",
  });
  return [
    make(
      "assignment",
      `Industrialization — ${version === 1 ? "original" : `revision ${version - 1}`}.txt`,
      version === 1
        ? essayOriginal
        : version === 2
          ? essayRevision
          : essayPolished,
    ),
    make("instructions", "Assignment instructions", instructionsText),
    make("rubric", "Essay rubric", rubricText),
    make("feedback", "Teacher feedback", feedbackText),
    make(
      "context",
      "Course sources & lecture notes",
      `ILLUSTRATIVE COURSE MATERIALS — prepared for this demo, not an externally verified research source.\nCourse source pack — Economic change: Real wages increased over the later nineteenth century; this aggregate trend does not describe every worker's experience.\nCourse source pack — Factory reform: Testimony to the 1832 Sadler Committee describes long hours, exhaustion, and injuries involving young factory workers. The testimony was gathered in a reform context. The Factory Act of 1833 restricted children's factory working hours and established inspection.\nLecture notes — Public health: Rapid urban growth produced overcrowding and contaminated water. Sanitation reforms developed gradually. The notes do not establish an elimination date for waterborne disease.\nLecture notes — Collective action: Workers formed associations and pressed for reforms. Historical progress should be evaluated across income, health, and autonomy.`,
    ),
  ];
}
