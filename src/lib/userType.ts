// Mantém sincronizado com src/user/enum/user-type.enum.ts do backend
export const UserType = {
  COMUM: 1,
  AUXILIAR: 2,
  DIRETOR: 3,
  ESTRATEGICO: 4,
  FINANCEIRO: 5,
  PD: 6,
  GESTOR_VERBA: 7,
  TECNICO: 9,
  MASTER: 10,
} as const;
