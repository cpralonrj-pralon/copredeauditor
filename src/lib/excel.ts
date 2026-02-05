import * as XLSX from 'xlsx';
import type { Incident } from '@/types';

export const parseExcel = (file: File): Promise<Incident[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                // Read without cellDates to avoid JS Date timezone pollution
                const workbook = XLSX.read(data, { type: 'binary', cellNF: true });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    raw: false,
                    dateNF: 'dd/mm/yyyy hh:mm'
                });

                // Assume first row is header
                const headers = (jsonData[0] as string[]).map(h => h.trim().toUpperCase());
                const rows = jsonData.slice(1);

                const mappedData: Incident[] = rows.map((row: any, index) => {
                    const getVal = (colName: string) => {
                        const colIndex = headers.indexOf(colName);
                        return colIndex !== -1 ? row[colIndex] : '';
                    };

                    return {
                        id: `temp-${index}`, // Temporary ID
                        indicador_nome_icg: getVal('INDICADOR_NOME_ICG'),
                        id_mostra: getVal('ID_MOSTRA'),
                        volume: Number(getVal('VOLUME')) || 0,
                        indicador: getVal('INDICADOR'),
                        indicador_status: getVal('INDICADOR_STATUS'),
                        in_regional: getVal('IN_REGIONAL'),
                        in_grupo: getVal('IN_GRUPO'),
                        in_cidade_uf: getVal('IN_CIDADE_UF'),
                        in_uf: getVal('IN_UF'),
                        tecnologia: getVal('TECNOLOGIA'),
                        servico: getVal('SERVICO'),
                        natureza: getVal('NATUREZA'),
                        sintoma: getVal('SINTOMA'),
                        ferramenta_abertura: getVal('FERRAMENTA_ABERTURA'),
                        fechamento: getVal('FECHAMENTO'),
                        solucao: getVal('SOLUCAO'),
                        impacto: getVal('IMPACTO'),
                        enviado_toa: getVal('ENVIADO_TOA'),
                        dt_inicio: getVal('DT_INICIO'),
                        dt_inicio_sistema: getVal('DT_INICIO_SISTEMA'),
                        dt_inicio_chegou_cop_fo: getVal('DT_INICIO_CHEGOU_COP_FO'),
                        dt_em_progresso: getVal('DT_EM_PROGRESSO'),
                        dt_designado: getVal('DT_DESIGNADO'),
                        dt_primeiro_acionamento_rf: getVal('DT_PRIMEIRO_ACIONAMENTO_RF'),
                        dt_primeiro_acionamento_fo: getVal('DT_PRIMEIRO_ACIONAMENTO_FO'),
                        dt_primeiro_acionamento_gpon: getVal('DT_PRIMEIRO_ACIONAMENTO_GPON'),
                        dt_fim: getVal('DT_FIM'),
                        dt_fim_sistema: getVal('DT_FIM_SISTEMA'),
                        dt_fim_sistema_primeiro_fechamento: getVal('DT_FIM_SISTEMA_PRIMEIRO_FECHAMENTO'),
                        tma: getVal('TMA'),
                        tmr: getVal('TMR'),
                        anomes: getVal('ANOMES'),
                    };
                }).filter(item => item.id_mostra || item.indicador); // Filter empty rows

                resolve(mappedData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
