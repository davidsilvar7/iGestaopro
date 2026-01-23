import React from 'react';
import { ServiceOrder } from '../types';

interface Props {
    data: ServiceOrder | null;
}

const ServiceOrderReceipt: React.FC<Props> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="hidden print:block fixed inset-0 z-[100] bg-white p-8 text-black">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-center">
                    <img src="/jphone-logo.png" alt="Logo" className="h-12 w-auto mr-4" />
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider">JPhone Assistência</h1>
                        <p className="text-sm">Assistência Especializada Apple</p>
                        <p className="text-sm">CNPJ: 00.000.000/0001-00</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">Ordem de Serviço</h2>
                    <p className="text-lg">#{data.id.substring(0, 8)}</p>
                    <p className="text-sm text-slate-500">{new Date(data.entryDate).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-2">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                    <p><span className="font-semibold">Nome:</span> {data.customerName}</p>
                    {/* Note: Phone is not currently in ServiceOrder type, using placeholder if needed or just name */}
                </div>
            </div>

            {/* Device Info */}
            <div className="mb-6">
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1">Equipamento</h3>
                <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-lg">{data.deviceModel}</span>
                    <span className="px-3 py-1 bg-slate-100 rounded text-sm font-semibold">{data.status}</span>
                </div>
                <p className="mt-2 text-slate-700"><span className="font-semibold">Defeito Relatado:</span> {data.problemDescription}</p>
            </div>

            {/* Checklist */}
            {data.checklist && (
                <div className="mb-6">
                    <h3 className="font-bold text-sm uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1">Checklist de Entrada</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(data.checklist).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-2 border ${value ? 'bg-black border-black' : 'bg-white border-slate-300'}`}></span>
                                <span className="uppercase">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Terms */}
            <div className="mt-12 text-justify text-[10px] leading-relaxed text-slate-500 border-t border-slate-200 pt-4">
                <p className="mb-2 font-bold">TERMOS DE GARANTIA E SERVIÇO</p>
                <p>1. A JPhone Assistência oferece garantia de 90 dias sobre a peça substituída e a mão de obra realizada, conforme lei vigente.</p>
                <p>2. A garantia não cobre danos causados por mau uso, contato com líquidos, quedas ou intervenção de terceiros.</p>
                <p>3. Aparelhos não retirados em até 90 dias serão considerados abandonados e poderão ser vendidos para custear o conserto.</p>
            </div>

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-12 text-center text-sm">
                <div className="border-t border-slate-900 pt-2">
                    <p>Assinatura da Loja</p>
                </div>
                <div className="border-t border-slate-900 pt-2">
                    <p>Assinatura do Cliente</p>
                </div>
            </div>
        </div>
    );
};

export default ServiceOrderReceipt;
