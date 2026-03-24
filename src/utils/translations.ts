export const SECTOR_TRANSLATIONS: Record<string, string> = {
  LABORATORY: 'Laboratório',
  SURGICAL_CENTER: 'Centro Cirúrgico',
  BLOOD_BANK: 'Banco de Sangue',
  IESG: 'IESG',
  ONCOLOGY: 'Oncologia',
  NUTRITION: 'Nutrição',
  UTI_A: 'UTI A',
  HEMODYNAMICS: 'Hemodinâmica',
  RESONANCE: 'Ressonância',
  MAINTENANCE: 'Manutenção',
  CLINICAL_ENGINEERING: 'Engenharia Clínica',
  CCIH: 'CCIH',
};

export const FUNCTION_TRANSLATIONS: Record<string, string> = {
  ROOM: 'Ambiente',
  EQUIPMENT: 'Geladeira/Freezer'
};

export const ROLE_TRANSLATIONS: Record<string, string> = {
  USER: 'Usuário',
  ADMIN: 'Administrador'
};

/**
 * Traduz o setor de forma segura.
 */
export const translateSector = (sector: string | null | undefined): string => {
  if (!sector) return 'Não definido';
  return SECTOR_TRANSLATIONS[sector] || sector;
};

export const translateRole = (role: string | null | undefined): string => {
  if (!role) return 'Não definido';
  return ROLE_TRANSLATIONS[role] || role;
};
/**
 * Traduz a função do dispositivo (ROOM, EQUIPMENT, etc).
 * O nome da função é 'translateDeviceFunction' para evitar conflito com a palavra reservada 'function'.
 */
export const translateDeviceFunction = (deviceFunction: string | null | undefined): string => {
  if (!deviceFunction) return 'Não definida';
  return FUNCTION_TRANSLATIONS[deviceFunction] || deviceFunction;
};