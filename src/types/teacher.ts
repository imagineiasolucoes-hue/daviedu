import { z } from "zod";

export const teacherSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  subject: z.string().min(1, "A disciplina é obrigatória."),
  hire_date: z.date({
    required_error: "A data de contratação é obrigatória.",
  }),
});

export type Teacher = z.infer<typeof teacherSchema> & {
  user_id: string;
  created_at: string;
};

export type TeacherFormValues = z.infer<typeof teacherSchema>;

export const teacherSubjects = [
  "Matemática",
  "Português",
  "História",
  "Geografia",
  "Ciências",
  "Inglês",
  "Artes",
  "Educação Física",
];