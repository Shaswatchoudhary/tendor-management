import { AIGeneratedTender } from "@/lib/gemini";
import { JSONContent } from "@tiptap/core";

function createHeading(text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  };
}

function createParagraph(text: string): JSONContent {
  if (!text) return { type: "paragraph" };
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function createList(items: string[], listType: "ordered" | "bullet" | "lettered" = "ordered"): JSONContent {
  if (!items || items.length === 0) return { type: "paragraph" };

  const isLettered = listType === "lettered";
  return {
    type: listType === "bullet" ? "bulletList" : "orderedList",
    attrs: isLettered ? { class: "lettered-list" } : {},
    content: items.map((item) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: item }],
        },
      ],
    })),
  };
}

export function aiToTiptapJson(ai: AIGeneratedTender): JSONContent {
  const content: JSONContent[] = [];

  // 1. PROJECT DESCRIPTION
  if (ai.projectDescription && ai.projectDescription.trim() !== "") {
    content.push(createHeading("1. PROJECT DESCRIPTION"));
    content.push(createParagraph(ai.projectDescription));
  }

  // 2. SCOPE OF WORK
  if (ai.scopeOfWork && ai.scopeOfWork.length > 0) {
    content.push(createHeading("2. SCOPE OF WORK"));
    content.push(createList(ai.scopeOfWork, "ordered"));
  }

  // 3. TECHNICAL SPECIFICATIONS
  if (ai.technicalSpecifications && ai.technicalSpecifications.trim() !== "") {
    content.push(createHeading("3. TECHNICAL SPECIFICATIONS"));
    content.push(createParagraph(ai.technicalSpecifications));
  }

  // 4. TIME SCHEDULE OF TENDER ACTIVITIES
  content.push(createHeading("4. TIME SCHEDULE OF TENDER ACTIVITIES"));
  const timeScheduleItems = [
    `Last Date & Time for downloading tender documents: ${ai.timeSchedule?.documentDownloadEnd || "N/A"} from 09:00 AM`,
    `Last Date & Time for submission of Tender: ${ai.timeSchedule?.submissionDeadline || "N/A"} at 05:00 PM`,
    `Date & Time of opening of Tender: ${ai.timeSchedule?.openingDate || "N/A"} at 03:00 PM`,
  ];
  content.push(createList(timeScheduleItems, "lettered"));

  // 5. ELIGIBILITY CRITERIA
  if (ai.eligibilityCriteria && ai.eligibilityCriteria.length > 0) {
    content.push(createHeading("5. ELIGIBILITY CRITERIA"));
    content.push(createList(ai.eligibilityCriteria, "lettered"));
  }

  // 6. REQUIRED SKILLS & EXPERTISE
  if (ai.requiredSkills && ai.requiredSkills.length > 0) {
    content.push(createHeading("6. REQUIRED SKILLS & EXPERTISE"));
    content.push(createList(ai.requiredSkills, "ordered"));
  }

  // 7. FINANCIAL REQUIREMENTS
  if (ai.emdAmount || ai.paymentTerms) {
    content.push(createHeading("7. FINANCIAL REQUIREMENTS"));
    const financialItems = [];
    if (ai.emdAmount) financialItems.push(`Earnest Money Deposit (EMD): ${ai.emdAmount}`);
    if (ai.paymentTerms) financialItems.push(`Payment Terms: ${ai.paymentTerms}`);
    content.push(createList(financialItems, "lettered"));
  }

  // 8. DOCUMENTS TO BE SUBMITTED BY VENDOR is handled by the checklist panel outside Tiptap.

  // 9. EVALUATION CRITERIA
  if (ai.evaluationMethod && ai.evaluationMethod.trim() !== "") {
    content.push(createHeading("9. EVALUATION CRITERIA"));
    content.push(createParagraph(ai.evaluationMethod));
  }

  // 10. GENERAL TERMS & CONDITIONS
  if (ai.generalConditions && ai.generalConditions.length > 0) {
    content.push(createHeading("10. GENERAL TERMS & CONDITIONS"));
    content.push(createList(ai.generalConditions, "ordered"));
  }

  // 11. SUBMISSION INSTRUCTIONS
  if (ai.qualificationSummary && ai.qualificationSummary.trim() !== "") {
    content.push(createHeading("11. SUBMISSION INSTRUCTIONS"));
    content.push(createParagraph(ai.qualificationSummary));
  }

  return {
    type: "doc",
    content,
  };
}
