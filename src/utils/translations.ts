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
};

export const FUNCTION_TRANSLATIONS: Record<string, string> = {
  ROOM: 'Ambiente',
  EQUIPMENT: 'Geladeira/Freezer'
};

/**
 * Traduz o setor de forma segura.
 */
export const translateSector = (sector: string | null | undefined): string => {
  if (!sector) return 'Não definido';
  return SECTOR_TRANSLATIONS[sector] || sector;
};

/**
 * Traduz a função do dispositivo (ROOM, EQUIPMENT, etc).
 * O nome da função é 'translateDeviceFunction' para evitar conflito com a palavra reservada 'function'.
 */
export const translateDeviceFunction = (deviceFunction: string | null | undefined): string => {
  if (!deviceFunction) return 'Não definida';
  return FUNCTION_TRANSLATIONS[deviceFunction] || deviceFunction;
};