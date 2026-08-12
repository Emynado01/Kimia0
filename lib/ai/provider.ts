export type StoreContext = { revenue: number; orders: number; lowStock: string[]; expenses: number };
export interface AIProvider { answer(question: string, context: StoreContext): Promise<string>; }
/** TODO: add an OpenAI implementation only when OPENAI_API_KEY is supplied. */
export class OpenAIProvider implements AIProvider { async answer(): Promise<string> { throw new Error("OpenAI is not configured."); } }
