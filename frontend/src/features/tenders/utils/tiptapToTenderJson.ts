import { AIGeneratedTender } from "@/lib/gemini";
import { JSONContent } from "@tiptap/core";

function extractText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.content) {
    return node.content.map(extractText).join("");
  }
  return "";
}

function extractListItems(listNode: JSONContent | undefined): string[] {
  if (!listNode || !listNode.content) return [];
  return listNode.content
    .filter((n) => n.type === "listItem")
    .map((item) => extractText(item).trim());
}

function extractDateStr(str: string) {
  const match = str.match(/\d{2}\/\d{2}\/\d{4}/);
  if (match) return match[0];
  const parts = str.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : str;
}

function extractValueAfterColon(str: string) {
  const parts = str.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : str;
}

export function tiptapJsonToAi(tiptapDoc: JSONContent, originalAi: AIGeneratedTender): AIGeneratedTender {
  const result: AIGeneratedTender = JSON.parse(JSON.stringify(originalAi)); // deep copy

  // Reset fields that are managed by the editor. If they exist in Tiptap, they will be populated.
  // If they were deleted by the user, they will correctly remain empty.
  result.projectDescription = "";
  result.scopeOfWork = [];
  result.technicalSpecifications = "";
  result.eligibilityCriteria = [];
  result.requiredSkills = [];
  result.evaluationMethod = "";
  result.generalConditions = [];
  result.qualificationSummary = "";
  result.timeSchedule = { documentDownloadEnd: "", submissionDeadline: "", openingDate: "" };
  result.emdAmount = "";
  result.paymentTerms = "";

  if (!tiptapDoc.content) return result;

  let currentSection = "";

  for (const node of tiptapDoc.content) {
    if (node.type === "heading") {
      const headingText = extractText(node).toUpperCase();
      if (headingText.includes("PROJECT DESCRIPTION")) {
        currentSection = "projectDescription";
        result.projectDescription = "";
      } else if (headingText.includes("SCOPE OF WORK")) {
        currentSection = "scopeOfWork";
        result.scopeOfWork = [];
      } else if (headingText.includes("TECHNICAL SPECIFICATIONS")) {
        currentSection = "technicalSpecifications";
        result.technicalSpecifications = "";
      } else if (headingText.includes("TIME SCHEDULE")) {
        currentSection = "timeSchedule";
      } else if (headingText.includes("ELIGIBILITY CRITERIA")) {
        currentSection = "eligibilityCriteria";
        result.eligibilityCriteria = [];
      } else if (headingText.includes("REQUIRED SKILLS")) {
        currentSection = "requiredSkills";
        result.requiredSkills = [];
      } else if (headingText.includes("FINANCIAL REQUIREMENTS")) {
        currentSection = "financialRequirements";
      } else if (headingText.includes("EVALUATION CRITERIA")) {
        currentSection = "evaluationCriteria";
        result.evaluationMethod = "";
      } else if (headingText.includes("GENERAL TERMS")) {
        currentSection = "generalConditions";
        result.generalConditions = [];
      } else if (headingText.includes("SUBMISSION INSTRUCTIONS")) {
        currentSection = "submissionInstructions";
        result.qualificationSummary = "";
      } else {
        currentSection = "";
      }
      continue;
    }

    if (!currentSection) continue;

    if (node.type === "paragraph") {
      const text = extractText(node);
      if (currentSection === "projectDescription") {
        result.projectDescription = result.projectDescription ? result.projectDescription + "\n\n" + text : text;
      } else if (currentSection === "technicalSpecifications") {
        result.technicalSpecifications = result.technicalSpecifications ? result.technicalSpecifications + "\n\n" + text : text;
      } else if (currentSection === "evaluationCriteria") {
        result.evaluationMethod = result.evaluationMethod ? result.evaluationMethod + "\n\n" + text : text;
      } else if (currentSection === "submissionInstructions") {
        result.qualificationSummary = result.qualificationSummary ? result.qualificationSummary + "\n\n" + text : text;
      }
    } else if (node.type === "orderedList" || node.type === "bulletList") {
      const items = extractListItems(node);
      if (currentSection === "scopeOfWork") {
        result.scopeOfWork = [...result.scopeOfWork, ...items];
      } else if (currentSection === "eligibilityCriteria") {
        result.eligibilityCriteria = [...result.eligibilityCriteria, ...items];
      } else if (currentSection === "requiredSkills") {
        result.requiredSkills = [...result.requiredSkills, ...items];
      } else if (currentSection === "generalConditions") {
        result.generalConditions = [...result.generalConditions, ...items];
      } else if (currentSection === "timeSchedule") {
        items.forEach((item) => {
          const lower = item.toLowerCase();
          if (lower.includes("downloading")) result.timeSchedule.documentDownloadEnd = extractDateStr(item);
          if (lower.includes("submission")) result.timeSchedule.submissionDeadline = extractDateStr(item);
          if (lower.includes("opening")) result.timeSchedule.openingDate = extractDateStr(item);
        });
      } else if (currentSection === "financialRequirements") {
        items.forEach((item) => {
          const lower = item.toLowerCase();
          if (lower.includes("emd") || lower.includes("earnest")) result.emdAmount = extractValueAfterColon(item);
          if (lower.includes("payment")) result.paymentTerms = extractValueAfterColon(item);
        });
      }
    }
  }

  return result;
}
