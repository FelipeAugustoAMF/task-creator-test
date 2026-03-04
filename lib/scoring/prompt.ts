export type PromptRenderData = {
  task_id: string;
  title: string;
  description: string;
};

export function renderPrompt(template: string, data: PromptRenderData) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    const value = (data as Record<string, string>)[key];
    return typeof value === "string" ? value : match;
  });
}

