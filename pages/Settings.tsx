import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, User, Database, Globe } from 'lucide-react';

const Settings: React.FC = () => {
    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
                <p className="text-slate-500">Gerencie as preferências do sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Profile Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Perfil</h3>
                    <p className="text-sm text-slate-500">Gerenciar conta, e-mail e foto.</p>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Bell size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Notificações</h3>
                    <p className="text-sm text-slate-500">Preferências de e-mail e alertas.</p>
                </div>

                {/* Security */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-green-300 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <Shield size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Segurança</h3>
                    <p className="text-sm text-slate-500">Alterar senha e autenticação.</p>
                </div>

                {/* System Data */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Database size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Backup de Dados</h3>
                    <p className="text-sm text-slate-500">Exportar ou restaurar dados.</p>
                </div>

                {/* General */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <SettingsIcon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Geral</h3>
                    <p className="text-sm text-slate-500">Idioma, fuso horário e tema.</p>
                </div>

            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                <p>⚠️ Algumas configurações podem exigir permissões de administrador.</p>
            </div>
        </div>
    );
};

export default Settings;
