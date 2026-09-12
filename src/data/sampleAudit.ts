import type { AuditReport, Evidence, AnalysisItem } from "../types/audit";
const ev = (role: string, location: string, quote?: string): Evidence => ({
  sourceId: `sample-${role}`,
  location,
  ...(quote ? { quote } : {}),
});
export const sampleEvidence = ev;
const item = (
  id: string,
  title: string,
  detail: string,
  suggestion: string,
  evidence: Evidence[],
): AnalysisItem => ({ id, title, detail, suggestion, evidence });
export function sampleReport(version = 1): AuditReport {
  const revised = version > 1;
  const polished = version > 2;
  const report: AuditReport = {
    meta: {
      title: "Industrialization and the Working Class",
      createdAt: new Date(
        `2026-09-0${Math.min(version, 3) + 4}T14:30:00.000Z`,
      ).toISOString(),
      versionNumber: version,
      assignmentType: "Essay",
      depth: "Deep",
      sourceCount: 5,
      isDemo: true,
    },
    overall: {
      readiness: revised
        ? "Stronger — a few gaps remain"
        : "Strong foundation — revision recommended",
      evaluation: revised
        ? "The revised argument now weighs gains against costs, and the counterargument strengthens the judgment. Urban-life analysis and source traceability still need attention."
        : "You have a clear structure and relevant historical knowledge. The next step is to turn description into a sustained, qualified argument.",
      mainStrength: revised
        ? "A qualified thesis that gives each paragraph a clear analytical purpose."
        : "A coherent structure connects economic change, factory conditions, and urban life.",
      biggestWeakness: revised
        ? "The urban-life paragraph still summarizes more than it evaluates."
        : "Your evidence describes change without consistently establishing who benefited, or at what cost.",
      priorityAction: revised
        ? "Connect the urban-life evidence directly to your judgment about progress."
        : "Qualify the thesis, then weigh gains and costs in each body paragraph.",
      estimate: revised
        ? polished
          ? "24–27 / 32"
          : "22–25 / 32"
        : "18–21 / 32",
      uncertainty:
        "Illustrative, rubric-based estimate. This is not a predicted or guaranteed teacher grade.",
    },
    summary: revised
      ? "This revision makes a more defensible argument by distinguishing economic gains from wellbeing. The thesis now sets a clear standard for judging progress, and the factory paragraph considers an alternative interpretation. The economic paragraph also recognizes that workers experienced change differently. The largest remaining opportunity is to apply that same evaluative approach to urban life and make every borrowed claim traceable."
      : "Your response has a clear direction, relevant examples, and a useful three-part structure. The strongest material is the link between factory conditions and the need for reform. What holds the essay back is the leap from evidence of economic growth to a conclusion that all workers benefited. A more qualified thesis, explicit comparisons, and an evaluated counterargument would make the biggest difference.",
    priorities: [
      {
        ...item(
          "p-thesis",
          "Qualify the claim your evidence needs to prove",
          "The introduction calls industrialization “the decisive force” improving workers’ lives, but the body shows serious costs and a role for regulation. The argument is broader than the evidence supports.",
          "Define improvement in terms of income, health, and autonomy. Distinguish early costs from later gains, then explain the role of reform.",
          [
            ev(
              "assignment",
              "Introduction",
              "industrialization was the decisive force improving the lives of the British working class.",
            ),
            ev("rubric", "Analysis and evaluation"),
          ],
        ),
        severity: "High",
        impact:
          "Makes the central judgment defensible and gives every paragraph a clearer purpose.",
      },
      {
        ...item(
          "p-analysis",
          "Make the evidence prove your argument",
          "The wage paragraph jumps from purchasing power to a claim about “all workers.” It does not weigh income gains against the health costs discussed next.",
          "Add a comparison showing which workers gained, when, and whether higher wages compensated for risks to health and autonomy.",
          [
            ev(
              "assignment",
              "Economic change",
              "Industrialization therefore improved life for all workers.",
            ),
            ev(
              "feedback",
              "Comment 1",
              "Your analysis needs to go beyond describing the evidence.",
            ),
          ],
        ),
        severity: "High",
        impact:
          "Directly strengthens the analysis criterion and responds to two teacher comments.",
      },
      {
        ...item(
          "p-counter",
          "Test your judgment against another interpretation",
          "The response describes hardships, but does not develop and evaluate an argument that could challenge its own conclusion.",
          "Present the strongest case that factories improved security of income, then evaluate its limits using the health and child-labour evidence.",
          [
            ev("instructions", "Requirement 3"),
            ev("assignment", "Working conditions"),
          ],
        ),
        severity: "High",
        impact:
          "Addresses an explicit missing requirement and supports a more balanced judgment.",
      },
      {
        ...item(
          "p-citations",
          "Make the supporting claims traceable",
          "The final source list names the two course materials, but individual claims rarely identify the relevant source or section.",
          "Cite the course source pack alongside the wage and factory claims, and the lecture notes alongside the housing and public-health claims.",
          [
            ev("assignment", "Sources"),
            ev("rubric", "Evidence and referencing"),
            ev("feedback", "Comment 4"),
          ],
        ),
        severity: "Medium",
        impact:
          "Lets a reader verify the evidence and improves the referencing criterion.",
      },
    ],
    rubric: [
      {
        id: "r-knowledge",
        name: "Knowledge & understanding",
        expectation:
          "Select accurate, relevant knowledge of industrial Britain and use context to support the argument.",
        estimate: revised ? "6–7 / 8" : "5–6 / 8",
        status: "Nearly there",
        strengths:
          "The response identifies changes in employment, child labour, urban housing, and regulation. The Factory Act is linked to the preceding discussion of factory harms.",
        gaps: "Urban public-health developments are not situated precisely enough to establish the timing of improvements.",
        evidence: [
          ev("assignment", "Working conditions"),
          ev("assignment", "Urban life"),
        ],
        nextLevel:
          "Use the supplied material to distinguish early industrial conditions from later improvements. State when the materials do not support a precise date.",
        edits: [
          "Separate early costs from later benefits.",
          "Keep each contextual detail connected to the question.",
        ],
      },
      {
        id: "r-analysis",
        name: "Analysis & evaluation",
        expectation:
          "Sustain a defensible judgment, compare gains and costs, and evaluate alternative interpretations.",
        estimate: revised ? "5–6 / 8" : "3–4 / 8",
        status: revised ? "Nearly there" : "Needs work",
        strengths: revised
          ? "The thesis evaluates progress using more than income. The factory paragraph tests an income-based counterargument against health costs."
          : "The response recognizes that growth brought both opportunities and hardships, creating a useful basis for comparison.",
        gaps: revised
          ? "The urban-life paragraph still lists changes without explaining their weight in the overall judgment."
          : "The economic conclusion generalizes to all workers, and the response does not weigh competing interpretations.",
        evidence: [
          ev("assignment", "Economic change"),
          ev("assignment", "Urban life"),
          ev("rubric", "Analysis and evaluation"),
        ],
        nextLevel:
          "End each body paragraph by explaining how its evidence changes the answer to “to what extent.” Evaluate groups and time periods consistently.",
        edits: [
          "Explain why income is an incomplete measure of progress.",
          "Apply the same standard of judgment across all three body paragraphs.",
        ],
      },
      {
        id: "r-organization",
        name: "Organization",
        expectation:
          "Develop a focused thesis through coherent paragraphs and a conclusion that follows from the argument.",
        estimate: revised ? "6–7 / 8" : "6 / 8",
        status: "Strong",
        strengths:
          "The sequence from economic change to working conditions to urban life makes the competing dimensions of progress easy to follow.",
        gaps: revised
          ? "The shortened conclusion risks losing the wider significance requested in the instructions."
          : "The conclusion repeats the broad claim instead of resolving the tension between gains and costs.",
        evidence: [
          ev("assignment", "Introduction"),
          ev("assignment", "Conclusion"),
        ],
        nextLevel:
          "Make transitions carry the argument forward and preserve the final reflection on how progress should be judged.",
        edits: [
          "Connect the economic and working-conditions paragraphs with a comparative transition.",
          "Conclude with the standard you used to weigh the evidence.",
        ],
      },
      {
        id: "r-evidence",
        name: "Evidence & referencing",
        expectation:
          "Integrate both supplied course sources, make claims traceable, and consider the evidence’s limitations.",
        estimate: revised ? "5–6 / 8" : "4–5 / 8",
        status: "Nearly there",
        strengths: revised
          ? "The factory testimony is now placed in its reform context and identified alongside the relevant claim."
          : "Both required course sources are listed, and the factory testimony is a relevant example.",
        gaps: "Urban-life claims still need consistent references. A bibliography alone does not identify where specific evidence came from.",
        evidence: [ev("assignment", "Urban life"), ev("assignment", "Sources")],
        nextLevel:
          "Identify the relevant source section when using evidence and explain how a source’s purpose affects the strength of an inference.",
        edits: [
          "Add the lecture-note reference to public-health claims.",
          "Avoid suggesting that one testimony represents every factory.",
        ],
      },
    ],
    requirements: [
      {
        id: "q-judgment",
        requirement: "State and sustain a qualified judgment",
        status: revised ? "Met" : "Partially met",
        evidence: [ev("assignment", "Introduction")],
        notes: revised
          ? "The thesis distinguishes income from wellbeing and makes reform part of its judgment."
          : "A position is present, but it generalizes beyond what the evidence demonstrates.",
      },
      {
        id: "q-dimensions",
        requirement:
          "Consider economic change, working conditions, and urban life",
        status: "Met",
        evidence: [ev("assignment", "Body section headings")],
        notes: "All three required dimensions receive a dedicated paragraph.",
      },
      {
        id: "q-counter",
        requirement: "Include and evaluate an alternative interpretation",
        status: revised ? "Met" : "Missing",
        evidence: [ev("assignment", "Working conditions")],
        notes: revised
          ? "An income-security interpretation is considered and tested against health costs."
          : "Costs are described, but an alternative argument is not explicitly evaluated.",
      },
      {
        id: "q-sources",
        requirement: "Use and cite both supplied course sources",
        status: "Partially met",
        evidence: [ev("assignment", "Sources"), ev("assignment", "Urban life")],
        notes: "Both are named; claim-level references are incomplete.",
      },
      {
        id: "q-meaning",
        requirement: "Explain what evidence means for the judgment",
        status: "Partially met",
        evidence: [ev("assignment", "Urban life")],
        notes: revised
          ? "Economic and factory analysis improve; urban life remains mostly descriptive."
          : "Several examples are followed by description instead of an inference about progress.",
      },
      {
        id: "q-conclusion",
        requirement: "Discuss the wider significance in the conclusion",
        status: revised && !polished ? "Missing" : "Met",
        evidence: [ev("assignment", "Conclusion")],
        notes:
          revised && !polished
            ? "The shorter conclusion removes the original reflection on measuring progress."
            : "The ending connects the argument to how social progress should be evaluated.",
      },
    ],
    teacherFeedback: [
      {
        id: "t-analysis",
        assessment: revised
          ? "The economic paragraph now compares purchasing power with health costs. Urban life still reports changes without evaluating their weight."
          : "The wage paragraph moves from an example to a claim about all workers without explaining the inference.",
        comment: "Your analysis needs to go beyond describing the evidence.",
        status: revised ? "Partially addressed" : "Not addressed",
        evidence: [
          ev("assignment", "Economic change"),
          ev("assignment", "Urban life"),
        ],
        nextStep: revised
          ? "Bring the urban paragraph up to the analytical standard of the revised economic paragraph."
          : "After each example, explain how it changes your judgment about who benefited.",
      },
      {
        id: "t-groups",
        assessment: revised
          ? "The economic paragraph distinguishes children from other earners, and later gains from earlier health costs."
          : "The claim about all workers treats their experiences as uniform despite contrasting child-worker evidence.",
        comment:
          "Consider whose lives improved, and when. Avoid treating the working class as a single group.",
        status: revised ? "Addressed" : "Not addressed",
        evidence: [ev("assignment", "Economic change")],
        nextStep: revised
          ? "Maintain this distinction when discussing urban health."
          : "Distinguish children and adult wage earners, and early from later industrialization.",
      },
      {
        id: "t-counter",
        assessment: revised
          ? "The factory paragraph presents income security as an alternative interpretation, then weighs its limits."
          : "The discussion of harms does not explicitly develop an argument that challenges the conclusion.",
        comment:
          "Acknowledge another interpretation before reaching your final judgment.",
        status: revised ? "Addressed" : "Not addressed",
        evidence: [ev("assignment", "Working conditions")],
        nextStep: revised
          ? "Keep the counterargument connected to the criteria used in your final judgment."
          : "Develop the income-security argument, then evaluate what it does and does not explain.",
      },
      {
        id: "t-trace",
        assessment: revised
          ? "Economic and factory references improve traceability, but the urban claims still need consistent attribution."
          : "A source list is present, but it does not connect the individual factual claims to their sources.",
        comment: "Make it possible to trace claims back to the course sources.",
        status: "Partially addressed",
        evidence: [ev("assignment", "Sources"), ev("assignment", "Urban life")],
        nextStep:
          "Reference the lecture-note section beside the public-health claims and verify the remaining attributions.",
      },
    ],
    sections: [
      {
        id: "s-intro",
        name: "Introduction & thesis",
        summary: revised
          ? "A more specific standard for judging progress."
          : "Relevant context; the final claim needs qualification.",
        strengths:
          "The introduction establishes the shift from workshops to factories and leads directly to a judgment.",
        issues: revised
          ? "Carry the health-and-autonomy standard consistently into every body paragraph."
          : "“The decisive force” and the broad claim about working-class life are not sustained by the mixed evidence.",
        suggestion:
          "Make the relationship between economic growth and regulation explicit. Use the body to test that relationship.",
        evidence: [ev("assignment", "Introduction")],
      },
      {
        id: "s-economic",
        name: "Economic change",
        summary: revised
          ? "Income gains are now weighed against different workers’ experiences."
          : "The wage example is useful, but the inference goes too far.",
        strengths:
          "The paragraph chooses a directly relevant indicator: real wages and purchasing power.",
        issues: revised
          ? "The aggregate trend still needs to be treated as limited evidence about individual groups."
          : "The phrase “all workers” erases differences that the next paragraph introduces.",
        suggestion:
          "Explain why a higher average wage cannot establish that every group experienced a net improvement.",
        evidence: [ev("assignment", "Economic change")],
      },
      {
        id: "s-factory",
        name: "Working conditions & counterargument",
        summary: revised
          ? "A credible alternative interpretation and a source limitation."
          : "A strong example that needs more evaluation.",
        strengths:
          "Child-worker testimony and the Factory Act provide a meaningful connection between harm and reform.",
        issues: revised
          ? "Avoid allowing the counterargument to become a separate tangent."
          : "The paragraph describes dangerous conditions without explaining what they imply about the central judgment.",
        suggestion:
          "Explain whether reform shows that growth alone was insufficient to improve wellbeing.",
        evidence: [ev("assignment", "Working conditions")],
      },
      {
        id: "s-urban",
        name: "Urban life",
        summary: "The biggest remaining opportunity for deeper analysis.",
        strengths:
          "Housing, sanitation, and collective action are relevant dimensions beyond income.",
        issues: polished
          ? "The corrected claim is more cautious; collective action still needs an explanation of its contribution."
          : revised
            ? "The new disease-elimination claim is unsupported by the notes. The rest of the paragraph remains mostly descriptive."
            : "The paragraph lists urban problems and later improvements without weighing their significance.",
        suggestion:
          "Compare factory-led growth with publicly funded infrastructure. Explain why the distinction matters for your judgment.",
        evidence: [
          ev("assignment", "Urban life"),
          ev("context", "Lecture notes — Public health"),
        ],
      },
      {
        id: "s-conclusion",
        name: "Conclusion",
        summary:
          revised && !polished
            ? "More focused, but an important strength was removed."
            : "Bring the evidence back to a qualified judgment.",
        strengths:
          "The conclusion is brief and returns to the assignment question.",
        issues:
          revised && !polished
            ? "The revised ending drops the wider significance explicitly requested in the instructions."
            : "The conclusion can more clearly state how the competing gains and costs have been weighed.",
        suggestion:
          "Close by explaining why growth alone is an incomplete measure of social progress.",
        evidence: [
          ev("assignment", "Conclusion"),
          ev("instructions", "Requirement 6"),
        ],
      },
      {
        id: "s-sources",
        name: "Sources & attribution",
        summary:
          "Both course materials are present; tracing individual claims is harder.",
        strengths:
          "The source list identifies the course pack and lecture notes.",
        issues:
          "The extracted text does not establish consistent claim-level citation or visual formatting.",
        suggestion:
          "Check each factual claim against its source and verify the final document’s formatting separately.",
        evidence: [ev("assignment", "Sources")],
      },
    ],
    evidenceAnalysis: [
      item(
        "e-wages",
        "Averages need a qualification",
        "A later rise in real wages supports a claim about aggregate purchasing power. It cannot establish equal benefits for all groups.",
        "Keep the time period visible and compare income gains with costs to health.",
        [
          ev("assignment", "Economic change"),
          ev("context", "Course source pack — Economic change"),
        ],
      ),
      item(
        "e-testimony",
        "A strong source with a specific purpose",
        "The factory testimony helps establish harm to young workers, but it was collected during a reform inquiry.",
        "Explain why the testimony is relevant while limiting claims about how representative it is.",
        [
          ev("assignment", "Working conditions"),
          ev("context", "Course source pack — Factory reform"),
        ],
      ),
    ],
    writingAnalysis: [
      item(
        "w-vague",
        "Replace vague progress language",
        "Phrases such as “made conditions better” leave the reader to decide which dimension improved and why it matters.",
        "Name the outcome—health, income, autonomy—and connect it to the judgment.",
        [
          ev(
            "assignment",
            "Urban life",
            "Later improvements in public health made conditions better.",
          ),
        ],
      ),
      item(
        "w-transitions",
        "Let the transitions carry the comparison",
        "The sections are easy to identify, but the move from economic gains to factory costs could do more argumentative work.",
        "Use the transition to explain that income and wellbeing can move in different directions.",
        [ev("assignment", "Working conditions")],
      ),
    ],
    strengths: [
      item(
        "g-structure",
        "A structure that reflects the question",
        "Separate sections on income, factory work, and urban life give the response a purposeful comparative foundation.",
        "Preserve the structure as you deepen the analysis.",
        [ev("assignment", "Body section headings")],
      ),
      item(
        "g-reform",
        "A useful connection between harm and reform",
        "Placing the Factory Act after evidence of child-worker hardship creates a strong opening for evaluating the role of intervention.",
        "Explain what this sequence tells us about growth alone.",
        [ev("assignment", "Working conditions")],
      ),
      item(
        "g-context",
        "Context that earns its place",
        "The opening establishes the shift in production and employment without a long historical detour.",
        "Keep this economy of context in the revision.",
        [ev("assignment", "Introduction")],
      ),
    ],
    gaps: [
      item(
        "gap-format",
        "Visual formatting cannot be verified",
        "Text extraction does not preserve page layout, margins, or the appearance of references.",
        "Check the original document against any visual formatting requirements.",
        [],
      ),
      item(
        "gap-external",
        "External accuracy is limited to the supplied materials",
        "This audit compares your response with the course documents. It does not independently verify the historical claims against external scholarship.",
        "Verify factual details and sources before submitting.",
        [ev("context", "Course sources")],
      ),
    ],
    recommendedEdits: [
      {
        id: "edit-thesis",
        location: "Introduction · final sentence",
        current: revised
          ? "improvements in working-class life depended on regulation as well as economic growth."
          : "industrialization was the decisive force improving the lives of the British working class.",
        issue: revised
          ? "This is a defensible direction; the remaining paragraphs need to sustain it."
          : "The wording implies a general improvement that the body does not establish.",
        direction:
          "Frame your judgment around which groups benefited, when benefits emerged, and the role of regulation. Keep the wording in your own voice.",
        evidence: [ev("assignment", "Introduction")],
      },
      {
        id: "edit-urban",
        location: "Urban life · explanation after the evidence",
        current: "Later improvements in public health made conditions better.",
        issue:
          "The sentence reports an outcome without explaining its contribution to the argument.",
        direction:
          "Explain how public investment changed urban wellbeing and whether that improvement can be credited to industrial growth itself.",
        evidence: [ev("assignment", "Urban life")],
      },
    ],
    revisionPlan: {
      first: revised
        ? [
            "Deepen the urban-life comparison.",
            "Verify the public-health claim against the notes.",
          ]
        : [
            "Qualify the thesis around groups, time, and a definition of improvement.",
            "Add a gains-versus-costs comparison to each body paragraph.",
          ],
      next: revised
        ? [
            "Finish claim-level source references.",
            "Retain an evaluated counterargument.",
          ]
        : [
            "Develop and evaluate an income-security counterargument.",
            "Connect each factual claim to its course source.",
          ],
      polish: [
        "Make transitions advance the comparison.",
        "Restore or retain the wider significance in the conclusion.",
        "Check formatting in the original document.",
      ],
    },
    finalChecklist: [
      {
        id: "c-thesis",
        text: "Make the thesis specific about who benefited and when.",
      },
      {
        id: "c-analysis",
        text: "Explain how each body paragraph changes the overall judgment.",
      },
      {
        id: "c-counter",
        text: "Develop and evaluate an alternative interpretation.",
      },
      {
        id: "c-sources",
        text: "Make borrowed claims traceable to the course sources.",
      },
      {
        id: "c-conclusion",
        text: "Connect the conclusion to the wider significance.",
      },
      {
        id: "c-format",
        text: "Verify document formatting and proofread the final draft.",
      },
    ],
  };
  if (revised)
    report.priorities = [
      {
        ...item(
          "p-urban",
          "Bring urban-life analysis up to the rest of the essay",
          "The economic and factory paragraphs now evaluate progress. The urban paragraph still relies mainly on a sequence of problems and reforms.",
          "Explain whether public-health improvements resulted from growth alone or required collective intervention.",
          [ev("assignment", "Urban life")],
        ),
        severity: "High",
        impact: "Makes the analysis sustained across the essay.",
      },
      ...(polished
        ? []
        : [
            {
              ...item(
                "p-new",
                "Verify the new claim about disease",
                "The assertion that sanitation reform had eliminated most waterborne disease by 1850 is not supported by the supplied notes.",
                "Remove the unsupported date and extent, or add an appropriate source before making the claim.",
                [
                  ev(
                    "assignment",
                    "Urban life",
                    "By 1850, sanitation reform had eliminated most waterborne disease across industrial Britain.",
                  ),
                  ev("context", "Lecture notes — Public health"),
                ],
              ),
              severity: "High" as const,
              impact:
                "Prevents an unsupported factual claim from weakening improved analysis.",
            },
          ]),
      report.priorities[3],
      ...(polished
        ? []
        : [
            {
              ...item(
                "p-significance",
                "Restore the wider significance in the conclusion",
                "The shorter ending removes the original connection to how progress should be evaluated.",
                "Bring back a concise reflection on the limits of judging social progress by economic output.",
                [
                  ev("assignment", "Conclusion"),
                  ev("instructions", "Requirement 6"),
                ],
              ),
              severity: "Medium" as const,
              impact:
                "Restores an explicit assignment requirement and a strength of the original.",
            },
          ]),
    ];
  return report;
}
