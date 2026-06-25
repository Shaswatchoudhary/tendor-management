import { tiptapJsonToAi } from "./src/features/tenders/utils/tiptapToTenderJson";

const originalAi = {
  projectDescription: "OLD TEXT",
  scopeOfWork: [],
  technicalSpecifications: "OLD TECH",
  eligibilityCriteria: [],
  requiredSkills: [],
  emdAmount: "",
  paymentTerms: "",
  requiredDocuments: [],
  qualificationSummary: "",
  evaluationMethod: "",
  generalConditions: [],
  timeSchedule: { documentDownloadEnd: "", submissionDeadline: "", openingDate: "" }
};

const tiptapDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. SCOPE OF WORK" }] },
    { type: "orderedList", content: [] }
  ]
};

const result = tiptapJsonToAi(tiptapDoc as any, originalAi as any);
console.log("projectDescription:", JSON.stringify(result.projectDescription));
console.log("technicalSpecifications:", JSON.stringify(result.technicalSpecifications));
