import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { Incident } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface AuditModalProps {
    incident: Incident;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: { status: 'Tratado', corrigido: boolean, motivo: string, loginOfensor?: string, evidenciaUrl?: string | null }) => void;
}

export function AuditModal({ incident, isOpen, onClose, onSave }: AuditModalProps) {
    const [corrigido, setCorrigido] = useState<boolean | null>(null);
    const [motivo, setMotivo] = useState('');
    const [loginOfensor, setLoginOfensor] = useState('');
    const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        if (corrigido === null || !motivo) return;
        onSave(incident.id, {
            status: 'Tratado',
            corrigido,
            motivo,
            loginOfensor,
            evidenciaUrl
        });
        onClose();
        setUploading(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${incident.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('evidence')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('evidence').getPublicUrl(filePath);
            setEvidenciaUrl(data.publicUrl);
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload da imagem.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Tratar Incidente</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">ID Mostra</p>
                            <p className="font-medium text-slate-800">{incident.id_mostra}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Indicador</p>
                            <p className="font-medium text-slate-800">{incident.indicador}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-slate-500 text-xs uppercase tracking-wider">Sintoma</p>
                            <p className="text-slate-700">{incident.sintoma}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Corrigido?</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCorrigido(true)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                                        corrigido === true ? "bg-green-50 border-green-200 text-green-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    Sim
                                </button>
                                <button
                                    onClick={() => setCorrigido(false)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                                        corrigido === false ? "bg-red-50 border-red-200 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    Não
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Motivo / Justificativa</label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm h-24 resize-none uppercase"
                                placeholder="DESCREVA O MOTIVO..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Login Ofensor (Opcional)</label>
                            <input
                                type="text"
                                value={loginOfensor}
                                onChange={(e) => setLoginOfensor(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm uppercase"
                                placeholder="DIGITE O LOGIN..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Evidência (Opcional)</label>
                            <div className="flex items-center gap-3">
                                {evidenciaUrl ? (
                                    <div className="relative group">
                                        <img src={evidenciaUrl} alt="Evidência" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                                        <button
                                            onClick={() => setEvidenciaUrl(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                        uploading ? "bg-slate-50 border-slate-300" : "border-slate-300 hover:bg-slate-50 hover:border-blue-400"
                                    )}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {uploading ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-1" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                            )}
                                            <p className="text-xs text-slate-500">{uploading ? 'Enviando...' : 'Clique para enviar imagem'}</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={corrigido === null || !motivo}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-900/10"
                    >
                        Salvar Tratamento
                    </button>
                </div>
            </div>
        </div>
    );
}
