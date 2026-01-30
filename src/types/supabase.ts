export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            assertividade_incidentes: {
                Row: {
                    id: string
                    created_at: string
                    indicador_nome_icg: string | null
                    id_mostra: string | null
                    volume: number | null
                    indicador: string | null
                    indicador_status: string | null
                    in_regional: string | null
                    in_grupo: string | null
                    in_cidade_uf: string | null
                    in_uf: string | null
                    tecnologia: string | null
                    servico: string | null
                    natureza: string | null
                    sintoma: string | null
                    ferramenta_abertura: string | null
                    fechamento: string | null
                    solucao: string | null
                    impacto: string | null
                    enviado_toa: string | null
                    dt_inicio: string | null
                    dt_inicio_sistema: string | null
                    dt_inicio_chegou_cop_fo: string | null
                    dt_em_progresso: string | null
                    dt_designado: string | null
                    dt_primeiro_acionamento_rf: string | null
                    dt_primeiro_acionamento_fo: string | null
                    dt_primeiro_acionamento_gpon: string | null
                    dt_fim: string | null
                    dt_fim_sistema: string | null
                    dt_fim_sistema_primeiro_fechamento: string | null
                    tma: string | null
                    tmr: string | null
                    anomes: string | null
                    status_audit: string | null
                    audit_corrigido: boolean | null
                    audit_login: string | null
                    audit_motivo: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    indicador_nome_icg?: string | null
                    id_mostra?: string | null
                    volume?: number | null
                    indicador?: string | null
                    indicador_status?: string | null
                    in_regional?: string | null
                    in_grupo?: string | null
                    in_cidade_uf?: string | null
                    in_uf?: string | null
                    tecnologia?: string | null
                    servico?: string | null
                    natureza?: string | null
                    sintoma?: string | null
                    ferramenta_abertura?: string | null
                    fechamento?: string | null
                    solucao?: string | null
                    impacto?: string | null
                    enviado_toa?: string | null
                    dt_inicio?: string | null
                    dt_inicio_sistema?: string | null
                    dt_inicio_chegou_cop_fo?: string | null
                    dt_em_progresso?: string | null
                    dt_designado?: string | null
                    dt_primeiro_acionamento_rf?: string | null
                    dt_primeiro_acionamento_fo?: string | null
                    dt_primeiro_acionamento_gpon?: string | null
                    dt_fim?: string | null
                    dt_fim_sistema?: string | null
                    dt_fim_sistema_primeiro_fechamento?: string | null
                    tma?: string | null
                    tmr?: string | null
                    anomes?: string | null
                    status_audit?: string | null
                    audit_corrigido?: boolean | null
                    audit_login?: string | null
                    audit_motivo?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    indicador_nome_icg?: string | null
                    id_mostra?: string | null
                    volume?: number | null
                    indicador?: string | null
                    indicador_status?: string | null
                    in_regional?: string | null
                    in_grupo?: string | null
                    in_cidade_uf?: string | null
                    in_uf?: string | null
                    tecnologia?: string | null
                    servico?: string | null
                    natureza?: string | null
                    sintoma?: string | null
                    ferramenta_abertura?: string | null
                    fechamento?: string | null
                    solucao?: string | null
                    impacto?: string | null
                    enviado_toa?: string | null
                    dt_inicio?: string | null
                    dt_inicio_sistema?: string | null
                    dt_inicio_chegou_cop_fo?: string | null
                    dt_em_progresso?: string | null
                    dt_designado?: string | null
                    dt_primeiro_acionamento_rf?: string | null
                    dt_primeiro_acionamento_fo?: string | null
                    dt_primeiro_acionamento_gpon?: string | null
                    dt_fim?: string | null
                    dt_fim_sistema?: string | null
                    dt_fim_sistema_primeiro_fechamento?: string | null
                    tma?: string | null
                    tmr?: string | null
                    anomes?: string | null
                    status_audit?: string | null
                    audit_corrigido?: boolean | null
                    audit_login?: string | null
                    audit_motivo?: string | null
                }
            }
        }
    }
}
