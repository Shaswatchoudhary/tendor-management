export interface TenderHeader {
  refNo: string;
  issuanceDate: string;
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  submissionDeadline: string;
  emdAmount: string;
  location: string;
  completionPeriod: string;
}

export interface TenderSection {
  id: string; // "1", "2", "5", etc. — matches numbering in the doc
  heading: string; // "PROJECT DESCRIPTION"
  type: "paragraph" | "orderedList" | "letteredList" | "table";
  content?: string; // for type "paragraph"
  items?: string[]; // for type "orderedList" / "letteredList"
}

export interface RequiredDocument {
  id: string;
  label: string; // "GST Registration Certificate"
  required: boolean; // true = mandatory, false = optional
}

export interface TenderDraft {
  header: TenderHeader;
  sections: TenderSection[];
  requiredDocuments: RequiredDocument[];
}
