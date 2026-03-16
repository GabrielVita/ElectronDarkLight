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

/**
 * Função para traduzir o setor de forma segura.
 * Se o setor não existir no mapa, retorna o original.
 */
export const translateSector = (sector: string | null | undefined): string => {
  if (!sector) return 'Não definido';
  return SECTOR_TRANSLATIONS[sector] || sector;
};