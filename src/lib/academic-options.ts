export type AcademicLevel = 'Infantil' | 'Fundamental I' | 'Fundamental II';

export interface ClassOption {
  level: AcademicLevel;
  name: string;
}

export const academicLevels: AcademicLevel[] = [
  'Infantil',
  'Fundamental I',
  'Fundamental II',
];

export const classOptions: ClassOption[] = [
  // Educação Infantil
  { level: 'Infantil', name: 'Grupo G2' },
  { level: 'Infantil', name: 'Grupo G3' },
  { level: 'Infantil', name: 'Grupo G4' },
  { level: 'Infantil', name: 'Grupo G5' },
  
  // Ensino Fundamental I
  { level: 'Fundamental I', name: '1º Ano' },
  { level: 'Fundamental I', name: '2º Ano' },
  { level: 'Fundamental I', name: '3º Ano' },
  { level: 'Fundamental I', name: '4º Ano' },
  { level: 'Fundamental I', name: '5º Ano' },
  
  // Ensino Fundamental II
  { level: 'Fundamental II', name: '6º Ano' },
  { level: 'Fundamental II', name: '7º Ano' },
  { level: 'Fundamental II', name: '8º Ano' },
  { level: 'Fundamental II', name: '9º Ano' },
];

/**
 * Maps the class name back to its academic level.
 * @param className The name of the class (e.g., '1º Ano').
 * @returns The corresponding AcademicLevel or undefined.
 */
export const getLevelByClassName = (className: string): AcademicLevel | undefined => {
    return classOptions.find(opt => opt.name === className)?.level;
};