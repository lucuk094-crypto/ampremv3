import React, { useState } from 'react';
import {
  Search,
  Copy,
  Check,
  Trash2,
  Eye,
  History,
  Dices,
  Download,
} from 'lucide-react';
import {
  ActivationHistoryItem,
  exportHistoryToCsv,
  formatValidityInfo,
} from '../utils/amLogic';

interface HistorySectionProps {
  items: ActivationHistoryItem[];
  onSelectRecord: (item: ActivationHistoryItem) => void;
  onDeleteRecord: (id: string) => void;
  onSwitchToRandomGenerator: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  items,
  onSelectRecord,
  onDeleteRecord,
  onSwitchToRandomGenerator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'verified' | 'sent'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesStage = stageFilter === 'all' || item.stage === stageFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.email.toLowerCase().includes(q) ||
      item.uid.toLowerCase().includes(q) ||
      item.plan.toLowerCase().includes(q) ||
      item.creator.toLowerCase().includes(q);
    return matchesStage && matchesQuery;
  });

  const handleCopyUid = (uid: string, id: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleDownloadCsv = () => {
    if (items.length === 0) return;
    const csvContent = exportHistoryToCsv(items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-am-prem-van313-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="riwayat"
      aria-labelledby="heading-riwayat"
      className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg p-5 sm:p-8"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b-2 border-zinc-950 dark:border-zinc-700">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <span>LOG AKTIVASI LOKAL</span>
            <span aria-hidden="true">·</span>
            <span>TOTAL: {items.length} ENTRI</span>
          </div>
          <h2
            id="heading-riwayat"
            className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight mt-1"
          >
            03. Riwayat Aktivasi &amp; Sesi Akun
          </h2>
        </div>

        {/* Filter, Search & Export CSV Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-60">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari email atau UID..."
              aria-label="Cari riwayat email atau UID"
              className="w-full pl-9 pr-3 py-2 bg-[#F4F3EF] dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-600 text-xs font-medium text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-950"
            />
          </div>

          <div
            role="group"
            aria-label="Filter status riwayat"
            className="flex items-center bg-[#F4F3EF] dark:bg-zinc-800 p-1 border-2 border-zinc-950 dark:border-zinc-600"
          >
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageFilter === 'all'
                  ? 'bg-zinc-950 text-[#B8FF01]'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('verified')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageFilter === 'verified'
                  ? 'bg-zinc-950 text-[#B8FF01]'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Pro Aktif
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('sent')}
              className={`px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageFilter === 'sent'
                  ? 'bg-zinc-950 text-[#B8FF01]'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Link Terkirim
            </button>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-2 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 inline-flex items-center gap-1.5 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State vs Mobile Cards + Desktop Table */}
      {filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center bg-[#F4F3EF] dark:bg-zinc-800/60 border-2 border-zinc-950 dark:border-zinc-700 mt-6">
          <History className="w-8 h-8 text-zinc-700 dark:text-[#B8FF01] mx-auto mb-2" />
          <p className="font-display text-lg font-bold text-zinc-950 dark:text-white">
            Belum Ada Riwayat Aktivasi
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto mt-1">
            Setiap akun yang Anda kirimkan Magic Link atau verifikasi (baik menggunakan Email Pribadi, Email Random EmailQu.com, maupun Auto-Pilot 1-Klik) akan tercatat otomatis di sini.
          </p>
          <button
            type="button"
            onClick={onSwitchToRandomGenerator}
            className="mt-4 px-4 py-2.5 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-extrabold text-zinc-950 inline-flex items-center gap-2 brutal-btn brutal-shadow-sm cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Buat Akun dengan Email Random</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List (< md) for zero horizontal scroll on phones */}
          <div className="grid grid-cols-1 gap-3.5 mt-6 md:hidden">
            {filteredItems.map((item) => {
              const validity = formatValidityInfo(item.validUntil);
              return (
                <div
                  key={item.id}
                  className="p-4 bg-[#F4F3EF] dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-600 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-zinc-950 dark:text-white break-all">
                        {item.email}
                      </p>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-[#B8FF01] mt-0.5">
                        {item.plan}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                      {item.limit}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 space-y-0.5">
                    <div className="truncate">UID: {item.uid}</div>
                    <div>
                      Aktif s/d: {validity.formattedDate} ({validity.daysRemaining} hari)
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-300 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(item)}
                      className="px-3 py-1.5 bg-[#B8FF01] border-2 border-zinc-950 text-xs font-bold text-zinc-950 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspeksi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUid(item.uid, item.id)}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-semibold text-zinc-950 dark:text-white inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>UID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(item.id)}
                      aria-label={`Hapus riwayat ${item.email}`}
                      className="p-1.5 bg-white dark:bg-zinc-900 text-red-600 border-2 border-zinc-950 dark:border-zinc-500 inline-flex items-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block overflow-x-auto mt-6 border-2 border-zinc-950 dark:border-zinc-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-white font-mono text-xs border-b-2 border-zinc-950 dark:border-zinc-700">
                  <th className="py-3 px-4 font-semibold">EMAIL AKUN</th>
                  <th className="py-3 px-4 font-semibold">METODE / PAKET</th>
                  <th className="py-3 px-4 font-semibold">FIREBASE UID</th>
                  <th className="py-3 px-4 font-semibold">BERLAKU HINGGA</th>
                  <th className="py-3 px-4 font-semibold">LIMIT KUOTA</th>
                  <th className="py-3 px-4 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-950 dark:divide-zinc-700 text-xs">
                {filteredItems.map((item) => {
                  const validity = formatValidityInfo(item.validUntil);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F4F3EF] dark:hover:bg-zinc-800/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-950 dark:text-white whitespace-nowrap">
                        {item.email}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-zinc-950 dark:text-white">
                          {item.plan}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                          {item.emailMode === 'random' ? 'EMAILQU RANDOM' : 'EMAIL PRIBADI'} ·{' '}
                          {item.stage === 'verified' ? 'TERVERIFIKASI PRO' : 'LINK TERKIRIM'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-800 dark:text-zinc-200 tabular-nums whitespace-nowrap">
                        {item.uid}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-800 dark:text-zinc-200 tabular-nums whitespace-nowrap">
                        <div>{validity.formattedDate}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {validity.daysRemaining} hari tersisa
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white tabular-nums whitespace-nowrap">
                        {item.limit}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(item)}
                            aria-label={`Tampilkan detail ${item.email}`}
                            className="px-2.5 py-1.5 bg-[#B8FF01] border-2 border-zinc-950 font-bold text-zinc-950 inline-flex items-center gap-1 brutal-btn cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspeksi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyUid(item.uid, item.id)}
                            aria-label={`Salin UID untuk ${item.email}`}
                            className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-950 dark:border-zinc-500 font-semibold text-zinc-950 dark:text-white inline-flex items-center gap-1 brutal-btn cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#B8FF01]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>UID</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(item.id)}
                            aria-label={`Hapus riwayat ${item.email}`}
                            className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-red-50 text-red-600 border-2 border-zinc-950 dark:border-zinc-500 inline-flex items-center brutal-btn cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
