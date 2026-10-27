// Mapping from task categories (used in the UI) to required OASF skill identifiers.
// This is a deterministic, keyword‑based map – no AI or external service.
// Only the categories that appear in the Task Center dropdown are listed.
export const CATEGORY_TO_SKILLS: Record<string, string[]> = {
  research: ["natural_language_processing/text_summarization", "natural_language_processing/text_generation"],
  coding: ["code_generation", "code_review"],
  analysis: ["data_analysis"],
  general: [],
};
