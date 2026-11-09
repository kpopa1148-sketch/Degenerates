import { z } from "zod";
export const voteSchema = z.object({ nominationId: z.string().uuid(), candidateId: z.string().uuid() }).strict();
export const submissionSchema = z.object({
  nominationId: z.string().uuid(),
  candidateDiscordId: z.string().regex(/^\d{15,22}$/, "Некорректный Discord ID"),
  candidateName: z.string().trim().min(2).max(64),
  reason: z.string().trim().min(10).max(500),
}).strict();
