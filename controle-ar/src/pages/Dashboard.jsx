import React from 'react';
import MasterControlCard from '../components/MasterControlCard';
import DeviceTable from '../components/DeviceTable';
import { devices } from '../data/mockData';

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Não precisa mais passar props complexas */}
      <section>
        <MasterControlCard />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Visão Geral dos Dispositivos</h2>
            <p className="text-gray-500 text-sm">Status em tempo real de todas as placas conectadas.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
              {devices.filter(d => d.status === 'online').length} Online
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
              {devices.length} Total
            </span>
          </div>
        </div>

        <DeviceTable data={devices} />
      </section>

    </div>
  );
}