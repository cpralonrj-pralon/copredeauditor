import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Database as DatabaseIcon } from 'lucide-react';
import { parseExcel } from '@/lib/excel';
import type { Incident } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function Import() {
    const [data, setData] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const processFile = async (file: File) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setUploadSuccess(null);
        try {
            const parsedData = await parseExcel(file);

            // Check for status mismatches
            const invalidStatuses: Record<string, number> = {};
            let validCount = 0;

            parsedData.forEach(item => {
                const status = (item.indicador_status || '').trim().toUpperCase();
                if (status === 'NÃO ADERENTE') {
                    validCount++;
                } else {
                    invalidStatuses[status] = (invalidStatuses[status] || 0) + 1;
                }
            });

            if (validCount === 0 && parsedData.length > 0) {
                const foundStatuses = Object.keys(invalidStatuses).join(', ') || 'Vazio';
                setError(`Atenção: Nenhum registro "NÃO ADERENTE" encontrado. O sistema só mostra incidentes com este status. Status encontrados: ${foundStatuses}`);
            } else if (Object.keys(invalidStatuses).length > 0) {
                const foundStatuses = Object.entries(invalidStatuses).map(([k, v]) => `${k || 'Vazio'} (${v})`).join(', ');
                console.warn("Status diferentes de NÃO ADERENTE encontrados:", invalidStatuses);
                // Only warn, don't block
                setError(`Aviso: ${parsedData.length - validCount} registros têm status diferente de "NÃO ADERENTE" e não aparecerão na lista de auditoria. (Encontrados: ${foundStatuses})`);
            }

            setData(parsedData);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError("Erro ao ler o arquivo.");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadToDatabase = async () => {
        if (data.length === 0) return;
        setUploading(true);
        setError(null);
        setUploadSuccess(null);

        try {
            // Deduplicate data based on id_mostra (keep the last one found)
            const uniqueDataMap = new Map();
            data.forEach(item => {
                if (item.id_mostra) {
                    uniqueDataMap.set(item.id_mostra, item);
                }
            });
            const uniqueData = Array.from(uniqueDataMap.values());

            console.log(`Original count: ${data.length}, Unique count: ${uniqueData.length}`);

            if (uniqueData.length === 0) {
                throw new Error("Nenhum registro válido encontrado para importação. Verifique se a coluna 'ID_MOSTRA' existe e está preenchida em seu arquivo Excel.");
            }

            if (data.length !== uniqueData.length) {
                console.warn(`Removed ${data.length - uniqueData.length} duplicate records based on id_mostra.`);
            }

            // Map Incident type to Database Insert type
            // We process in chunks to avoid payload limits
            const chunkSize = 100;
            let insertedCount = 0;

            for (let i = 0; i < uniqueData.length; i += chunkSize) {
                const chunk = uniqueData.slice(i, i + chunkSize).map(item => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, created_at, ...rest } = item; // Remove local ID if present

                    // Ensure all fields map correctly
                    return {
                        ...rest,
                        tma: String(rest.tma),
                        tmr: String(rest.tmr),
                        volume: Number(rest.volume),
                        anomes: String(rest.anomes)
                    };
                });

                console.log(`Uploading chunk ${i / chunkSize + 1}... (${chunk.length} items)`);

                // Upsert: based on id_mostra (unique constraint must exist)
                const { error: upsertError } = await supabase
                    .from('assertividade_incidentes')
                    .upsert(chunk, {
                        onConflict: 'id_mostra',
                        ignoreDuplicates: false // Update if exists
                    });

                if (upsertError) {
                    console.error("Supabase Upsert Error:", upsertError);
                    throw upsertError;
                }
                insertedCount += chunk.length;
            }

            setUploadSuccess(insertedCount);
            console.log("Upload completed successfully:", insertedCount);

            // Delay clearing data slightly so user sees the success state transition
            setTimeout(() => {
                setData([]);
            }, 500);

        } catch (err) {
            console.error("Full error object:", err);
            const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
            setError(`Erro ao salvar no banco: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Importar Dados de Assertividade</h2>
                <p className="text-slate-500 mb-8">Arraste seu arquivo Excel ou clique para selecionar</p>

                {!uploadSuccess ? (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-4",
                            error ? "border-red-300 bg-red-50" : success ? "border-green-300 bg-green-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="file-upload"
                            onChange={handleFileChange}
                            disabled={loading || uploading}
                        />
                        <label htmlFor="file-upload" className="contents cursor-pointer">
                            {loading ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                            ) : success ? (
                                <>
                                    <CheckCircle size={48} className="text-green-500" />
                                    <p className="text-green-700 font-medium">Arquivo lido com sucesso! {data.length} registros.</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={48} className="text-slate-400" />
                                    <span className="text-slate-600 font-medium">Clique para selecionar arquivo</span>
                                </>
                            )}
                        </label>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <DatabaseIcon size={48} className="text-green-600 mb-4" />
                        <h3 className="text-xl font-bold text-green-800">Importação Concluída!</h3>
                        <p className="text-green-700">{uploadSuccess} registros processados (inseridos/atualizados) com sucesso.</p>
                        <button
                            onClick={() => { setUploadSuccess(null); setSuccess(false); }}
                            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Importar Mais
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center justify-center text-red-600 gap-2 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {data.length > 0 && !uploadSuccess && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="font-semibold text-slate-800">Pré-visualização</h3>
                            <p className="text-sm text-slate-500">Verifique os dados antes de confirmar</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setData([]); setSuccess(false); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
                                disabled={uploading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUploadToDatabase}
                                disabled={uploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <DatabaseIcon size={16} />
                                        Confirmar Importação
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">ID Mostra</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Indicador</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Regional</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Data Início</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Tecnologia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.slice(0, 50).map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3 text-slate-900 font-medium">{row.id_mostra}</td>
                                        <td className="px-6 py-3 text-slate-600">{row.indicador}</td>
                                        <td className="px-6 py-3 text-slate-600">{row.in_regional}</td>
                                        <td className="px-6 py-3 text-slate-600">{row.dt_inicio}</td>
                                        <td className="px-6 py-3 text-slate-600">{row.tecnologia}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
                        {data.length > 50 ? `Mostrando 50 de ${data.length} registros` : `${data.length} registros no total`}
                    </div>
                </div>
            )}

        </div>
    );
}
