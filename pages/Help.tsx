import React from 'react';
import { HelpCircle, Book, MessageCircle, Phone, FileQuestion, ExternalLink } from 'lucide-react';

const Help: React.FC = () => {
    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Central de Ajuda</h1>
                <p className="text-slate-500">Suporte e documentação</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Quick Links */}
                <div className="space-y-4">
                    <h2 className="font-bold text-slate-700">Como podemos ajudar?</h2>

                    <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center hover:shadow-md transition-shadow text-left">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4">
                            <Book size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Documentação</h3>
                            <p className="text-sm text-slate-500">Guia passo-a-passo do sistema.</p>
                        </div>
                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                    </button>

                    <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center hover:shadow-md transition-shadow text-left">
                        <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Chat com Suporte</h3>
                            <p className="text-sm text-slate-500">Fale com um atendente agora.</p>
                        </div>
                        <ExternalLink size={16} className="ml-auto text-slate-400" />
                    </button>

                    <button className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center hover:shadow-md transition-shadow text-left">
                        <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mr-4">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Suporte Telefônico</h3>
                            <p className="text-sm text-slate-500">0800 123 4567</p>
                        </div>
                    </button>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-bold text-slate-700 mb-4 flex items-center">
                        <FileQuestion className="mr-2 text-indigo-500" size={20} />
                        Perguntas Frequentes
                    </h2>

                    <div className="space-y-4">
                        <div className="border-b border-slate-100 pb-4">
                            <h4 className="font-semibold text-slate-800 mb-1">Como cadastro um novo produto?</h4>
                            <p className="text-sm text-slate-500">Vá até o menu ESTOQUE e clique no botão "+ Novo Produto" no canto superior direito.</p>
                        </div>
                        <div className="border-b border-slate-100 pb-4">
                            <h4 className="font-semibold text-slate-800 mb-1">Como fazer backup?</h4>
                            <p className="text-sm text-slate-500">Acesse Configurações no menu lateral e clique em "Backup de Dados".</p>
                        </div>
                        <div className="border-b border-slate-100 pb-4">
                            <h4 className="font-semibold text-slate-800 mb-1">Esqueci minha senha</h4>
                            <p className="text-sm text-slate-500">Na tela de login, clique em "Recuperar Acesso" para receber um link por e-mail.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Help;
