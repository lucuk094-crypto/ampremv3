/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send,
  ShieldCheck,
  Mail,
  Link2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Key,
  Layers,
  Loader2,
  FileCode2,
  ClipboardPaste,
  Dices,
  User,
  Code2,
  Sun,
  Moon,
  Grid,
} from 'lucide-react';
import {
  ActivationHistoryItem,
  AmVerifyResponse,
  buildAmSendEndpoint,
  buildAmVerifyEndpoint,
  DEVELOPER_NAME,
  EmailQuMessage,
  INITIAL_VERIFY_PLACEHOLDER,
  inspectMagicLink,
  SAMPLE_MAGIC_LINK,
  validateEmail,
} from './utils/amLogic';
import {
  buildSimulatedEmailQuNotification,
  ExecutionMode,
  fetchEmailQuInbox,
  generateEmailQuAddress,
  requestAmSend,
  requestAmVerify,
} from './utils/amApi';
import { CertificateCard } from './components/CertificateCard';
import { HistorySection } from './components/HistorySection';
import { EndpointDocsSection } from './components/EndpointDocsSection';
import { EmailQuPanel } from './components/EmailQuPanel';
import { Perspective3DGrid } from './components/Perspective3DGrid';
import { ProductionDiagnosticsBar } from './components/ProductionDiagnosticsBar';

const STORAGE_KEY = 'am_prem_van313_history_v2';

export default function App() {
  // 3D Brutalist Dark/Light Theme (Default: Dark Obsidian 3D Grid so the 3D neon-lime grid pops!)
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Active step in the provisioning workspace
  const [activeStep, setActiveStep] = useState<'send' | 'verify'>('send');
  // Dual Email Mode: 'personal' (Email Pribadi) vs 'random' (Email Random emailqu.com)
  const [emailSourceMode, setEmailSourceMode] = useState<'personal' | 'random'>('personal');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('live');

  // Form states — strictly empty by default so no personal user email is shown!
  const [personalEmail, setPersonalEmail] = useState<string>('');
  const [randomEmail, setRandomEmail] = useState<string>('');
  const [magicLink, setMagicLink] = useState<string>('');

  // Auto-Pilot 1-Click states
  const [isRunningAutoPilot, setIsRunningAutoPilot] = useState<boolean>(false);
  const [autoPilotStage, setAutoPilotStage] = useState<number>(0);

  // EmailQu generator & live inbox states
  const [emailQuDomains, setEmailQuDomains] = useState<string[]>([
    'screensyit.id',
    'digboost.fun',
    'shinstore.site',
    'ccsaku.shop',
  ]);
  const [inboxMessages, setInboxMessages] = useState<EmailQuMessage[]>([]);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);
  const [isPollingInbox, setIsPollingInbox] = useState<boolean>(false);
  const [autoRefreshInbox, setAutoRefreshInbox] = useState<boolean>(true);
  const [latestNotification, setLatestNotification] = useState<EmailQuMessage | null>(null);
  const knownMessageIdsRef = useRef<Set<string | number>>(new Set());

  // Effective email based on selected source mode
  const activeEmail = emailSourceMode === 'random' ? randomEmail : personalEmail;

  const setActiveEmail = (val: string) => {
    if (emailSourceMode === 'random') {
      setRandomEmail(val);
    } else {
      setPersonalEmail(val);
    }
  };

  // Validation & feedback states
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active Certificate Result
  const [currentResult, setCurrentResult] = useState<AmVerifyResponse>(
    INITIAL_VERIFY_PLACEHOLDER
  );
  const [lastEndpointUrl, setLastEndpointUrl] = useState<string>(() =>
    buildAmSendEndpoint('pengguna@screensyit.id')
  );
  const [usedFallback, setUsedFallback] = useState<boolean>(false);

  // Activation History in localStorage
  const [history, setHistory] = useState<ActivationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  // Generate a random email from emailqu.com
  const handleGenerateRandomEmail = useCallback(
    async (customUser?: string, customDomain?: string): Promise<string> => {
      setIsGeneratingEmail(true);
      setSendError(null);
      try {
        const res = await generateEmailQuAddress(customUser, customDomain);
        setRandomEmail(res.email);
        if (res.domains.length > 0) {
          setEmailQuDomains(res.domains);
        }
        setInboxMessages([]);
        setLatestNotification(null);
        knownMessageIdsRef.current = new Set();
        return res.email;
      } finally {
        setIsGeneratingEmail(false);
      }
    },
    []
  );

  // Poll inbox on emailqu.com
  const handlePollInbox = useCallback(async () => {
    if (!randomEmail) return;
    setIsPollingInbox(true);
    try {
      const remoteMsgs = await fetchEmailQuInbox(randomEmail);
      setInboxMessages((prev) => {
        const simMsgs = prev.filter((m) => String(m.id).startsWith('sim-'));
        const merged = [...remoteMsgs];
        for (const s of simMsgs) {
          if (!merged.some((m) => m.id === s.id)) {
            merged.unshift(s);
          }
        }

        for (const msg of merged) {
          if (!knownMessageIdsRef.current.has(msg.id)) {
            knownMessageIdsRef.current.add(msg.id);
            setLatestNotification(msg);
          }
        }
        return merged;
      });
    } finally {
      setIsPollingInbox(false);
    }
  }, [randomEmail]);

  // Auto-generate first random email when switching to 'random' mode if empty
  useEffect(() => {
    if (emailSourceMode === 'random' && !randomEmail && !isGeneratingEmail) {
      handleGenerateRandomEmail();
    }
  }, [emailSourceMode, randomEmail, isGeneratingEmail, handleGenerateRandomEmail]);

  // Auto-polling interval when in random mode and autoRefreshInbox is enabled
  useEffect(() => {
    if (emailSourceMode !== 'random' || !randomEmail || !autoRefreshInbox) {
      return;
    }
    handlePollInbox();
    const timer = setInterval(() => {
      handlePollInbox();
    }, 5000);
    return () => clearInterval(timer);
  }, [emailSourceMode, randomEmail, autoRefreshInbox, handlePollInbox]);

  // Simulate incoming Alight Motion email notification in EmailQu inbox
  const handleSimulateIncomingMail = useCallback(
    (targetAddress?: string): EmailQuMessage => {
      const recipient = targetAddress || randomEmail || 'van313user@screensyit.id';
      const simulatedMsg = buildSimulatedEmailQuNotification(recipient);
      knownMessageIdsRef.current.add(simulatedMsg.id);
      setInboxMessages((prev) => [simulatedMsg, ...prev]);
      setLatestNotification(simulatedMsg);
      return simulatedMsg;
    },
    [randomEmail]
  );

  // Core verification runner (used by form submit, 1-click notification, and 1-Click Full Auto-Pilot)
  const executeVerification = async (
    targetEmailRaw: string,
    targetLinkRaw: string,
    modeOverride?: 'personal' | 'random'
  ) => {
    setVerifyError(null);
    setVerifySuccessMsg(null);

    const emailCheck = validateEmail(targetEmailRaw);
    if (!emailCheck.valid) {
      setVerifyError(emailCheck.error || 'Alamat email wajib diisi dengan benar.');
      return;
    }

    const linkCheck = inspectMagicLink(targetLinkRaw);
    if (!linkCheck.isValid) {
      setVerifyError(
        linkCheck.error || 'Tautan Magic Link tidak valid. Pastikan URL lengkap.'
      );
      return;
    }

    setIsVerifying(true);

    try {
      const { response, endpointUrl, usedSimulationFallback } =
        await requestAmVerify(
          emailCheck.cleaned,
          linkCheck.cleanUrl,
          executionMode
        );

      setLastEndpointUrl(endpointUrl);
      setUsedFallback(usedSimulationFallback);
      setCurrentResult(response);

      if (!response.status) {
        setVerifyError(
          response.message || 'Verifikasi Magic Link gagal. Pastikan tautan belum kedaluwarsa.'
        );
      } else {
        const verifiedData = response.data || {
          email: emailCheck.cleaned,
          uid: 'ZnxdpORrbJSbENfBPgRULyNq3Yz2',
          plan: 'Alight Motion Pro / Member',
          valid_until: '2027-11-01T19:15:07.395Z',
        };

        setVerifySuccessMsg(
          `Aktivasi berhasil! Akun ${verifiedData.email} kini berstatus ${verifiedData.plan}.`
        );

        const newRecord: ActivationHistoryItem = {
          id: `verify-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: 'verified',
          emailMode: modeOverride || emailSourceMode,
          email: verifiedData.email,
          uid: verifiedData.uid,
          plan: verifiedData.plan,
          validUntil: verifiedData.valid_until,
          creator: response.creator || 'Rin imup',
          limit: response.limit || '5/10 per 24 jam',
          rawResponse: response,
        };

        setHistory((prev) => [
          newRecord,
          ...prev.filter(
            (item) =>
              item.email.toLowerCase() !== verifiedData.email.toLowerCase()
          ),
        ]);
      }
    } catch (err) {
      setVerifyError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memverifikasi Magic Link.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // 1-CLICK FULL AUTO-PILOT PIPELINE
  const handleRunFullAutoPilot = async () => {
    if (isRunningAutoPilot) return;
    setIsRunningAutoPilot(true);
    setSendError(null);
    setVerifyError(null);
    setEmailSourceMode('random');
    setActiveStep('send');

    try {
      // Stage 1: Generate fresh EmailQu random address
      setAutoPilotStage(1);
      const freshEmail = await handleGenerateRandomEmail();

      // Stage 2: Trigger am-send
      setAutoPilotStage(2);
      const sendRes = await requestAmSend(freshEmail, executionMode);
      setLastEndpointUrl(sendRes.endpointUrl);
      setSendSuccessMsg(
        `Auto-Pilot: Magic Link berhasil dikirim ke ${freshEmail}.`
      );

      // Stage 3: Capture incoming message / token in EmailQu inbox
      setAutoPilotStage(3);
      const remoteInbox = await fetchEmailQuInbox(freshEmail);
      const mailWithLink = remoteInbox.find((m) => Boolean(m.extractedMagicLink));
      const finalMail =
        mailWithLink || handleSimulateIncomingMail(freshEmail);
      const extractedLink = finalMail.extractedMagicLink || SAMPLE_MAGIC_LINK;
      setMagicLink(extractedLink);

      // Stage 4: Switch to Step 02 and run am-verify automatically
      setActiveStep('verify');
      await executeVerification(freshEmail, extractedLink, 'random');
      setAutoPilotStage(4);
    } finally {
      setIsRunningAutoPilot(false);
    }
  };

  // Handler when user clicks "Gunakan Magic Link & Verifikasi Otomatis" inside EmailQu notification
  const handleUseMagicLinkFromMail = (extractedLink: string, emailAddress: string) => {
    setMagicLink(extractedLink);
    if (emailSourceMode === 'random') {
      setRandomEmail(emailAddress);
    } else {
      setPersonalEmail(emailAddress);
    }
    setActiveStep('verify');
    executeVerification(emailAddress, extractedLink);
  };

  // Handler: Step 1 - Send Magic Link (am-send)
  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccessMsg(null);

    const emailCheck = validateEmail(activeEmail);
    if (!emailCheck.valid) {
      setSendError(emailCheck.error || 'Alamat email tidak valid.');
      return;
    }

    setActiveEmail(emailCheck.cleaned);
    setIsSending(true);

    try {
      const { response, endpointUrl, usedSimulationFallback } =
        await requestAmSend(emailCheck.cleaned, executionMode);
      setLastEndpointUrl(endpointUrl);
      setUsedFallback(usedSimulationFallback);

      if (!response.status) {
        setSendError(
          response.message || 'Gagal mengirim Magic Link ke email tersebut.'
        );
      } else {
        setSendSuccessMsg(
          response.message ||
            `Tautan Magic Link berhasil dikirim ke ${emailCheck.cleaned}.`
        );

        if (emailSourceMode === 'random') {
          if (executionMode === 'simulate' || usedSimulationFallback) {
            handleSimulateIncomingMail(emailCheck.cleaned);
          } else {
            handlePollInbox();
          }
        }

        setHistory((prev) => {
          const existsVerified = prev.find(
            (item) =>
              item.email.toLowerCase() === emailCheck.cleaned.toLowerCase() &&
              item.stage === 'verified'
          );
          if (existsVerified) return prev;

          const newEntry: ActivationHistoryItem = {
            id: `send-${Date.now()}`,
            timestamp: new Date().toISOString(),
            stage: 'sent',
            emailMode: emailSourceMode,
            email: emailCheck.cleaned,
            uid: 'MENUNGGU-VERIFIKASI',
            plan: 'Pending Magic Link',
            validUntil: '2027-11-01T19:15:07.395Z',
            creator: response.creator || 'Rin imup',
            limit: response.limit || '5/10 per 24 jam',
            rawResponse: response,
          };
          return [
            newEntry,
            ...prev.filter(
              (item) =>
                item.email.toLowerCase() !== emailCheck.cleaned.toLowerCase()
            ),
          ];
        });
      }
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses permintaan am-send.'
      );
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Step 2 - Verify Magic Link Form Submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeVerification(activeEmail, magicLink);
  };

  // Select a history record to inspect in the CertificateCard
  const handleSelectHistoryRecord = (item: ActivationHistoryItem) => {
    setEmailSourceMode(item.emailMode || 'personal');
    if (item.emailMode === 'random') {
      setRandomEmail(item.email);
    } else {
      setPersonalEmail(item.email);
    }
    setCurrentResult({
      status: true,
      creator: item.creator,
      developer: DEVELOPER_NAME,
      data: {
        email: item.email,
        uid: item.uid,
        plan: item.plan,
        valid_until: item.validUntil,
      },
      limit: item.limit,
    });
    setLastEndpointUrl(buildAmVerifyEndpoint(item.email, magicLink || SAMPLE_MAGIC_LINK));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSwitchToRandomMode = () => {
    setActiveStep('send');
    setEmailSourceMode('random');
    setSendError(null);
    if (!randomEmail) {
      handleGenerateRandomEmail();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMagicLink(text);
        setVerifyError(null);
      }
    } catch {
      setMagicLink(SAMPLE_MAGIC_LINK);
    }
  };

  const linkInspection = inspectMagicLink(magicLink);

  return (
    <div className="relative min-h-screen flex flex-col text-zinc-950 dark:text-zinc-100 selection:bg-[#B8FF01] selection:text-zinc-950">
      {/* Realistic 3D Architectural Perspective Grid Background */}
      <Perspective3DGrid isDark={isDark} />

      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b-2 border-zinc-950 dark:border-[#B8FF01] px-4 sm:px-8 py-3.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title, single text element */}
          <a
            href="#workspace"
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-[#B8FF01] whitespace-nowrap shrink-0"
          >
            AMPREM.STUDIO
          </a>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
          >
            <a
              href="#workspace"
              className="hover:text-zinc-950 dark:hover:text-[#B8FF01] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workspace
            </a>
            <a
              href="#alur-kerja"
              className="hover:text-zinc-950 dark:hover:text-[#B8FF01] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Alur Aktivasi
            </a>
            <a
              href="#riwayat"
              className="hover:text-zinc-950 dark:hover:text-[#B8FF01] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Riwayat Akun
            </a>
            <a
              href="#endpoints"
              className="hover:text-zinc-950 dark:hover:text-[#B8FF01] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Endpoint Vercel
            </a>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleSwitchToRandomMode}
              className="px-3.5 sm:px-4 py-2 bg-[#B8FF01] hover:bg-[#a6e600] text-zinc-950 border-2 border-zinc-950 text-xs font-extrabold brutal-btn brutal-shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Generate Email Random
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Hero & Provisioning Workspace */}
        <section id="workspace" aria-labelledby="hero-title" className="space-y-6 sm:space-y-8">
          {/* Editorial 3D Brutalist Header Banner */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg p-5 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-zinc-700 dark:text-[#B8FF01]">
                <span>DEVELOPER: {DEVELOPER_NAME}</span>
                <span aria-hidden="true">·</span>
                <span>3D SPATIAL BRUTALISM</span>
                <span aria-hidden="true">·</span>
                <span>CREATOR API: RIN IMUP</span>
              </div>

              <h1
                id="hero-title"
                className="font-display text-3xl sm:text-5xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-[1.06] text-balance"
              >
                Studio Aktivasi Alight Motion Pro — Email Pribadi &amp; EmailQu Random.
              </h1>

              <p className="text-xs sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
                Pilih <strong>Email Pribadi</strong>, <strong>Generator Email Random (EmailQu.com)</strong> dengan notifikasi kotak masuk langsung, atau jalankan <strong>Auto-Pilot 1-Klik</strong> untuk mengaktifkan lisensi <strong>Alight Motion Pro / Member</strong> secara instan di HP maupun Laptop.
              </p>
            </div>

            {/* Workspace Toolbar: 3D Grid Theme Switcher + API Execution Mode */}
            <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 shrink-0">
              {/* 3D Grid Theme Switcher */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Grid className="w-3 h-3" />
                  <span>TEMA GRID 3D</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsDark((v) => !v)}
                  aria-label="Ubah tema Grid 3D Gelap atau Terang"
                  className="px-3.5 py-2 bg-[#F4F3EF] dark:bg-zinc-950 border-2 border-zinc-950 dark:border-[#B8FF01] text-xs font-bold text-zinc-950 dark:text-[#B8FF01] inline-flex items-center gap-2 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>3D Obsidian (Gelap)</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>3D Blueprint (Terang)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution Mode Switcher */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  MODE EKSEKUSI API
                </span>
                <div
                  role="group"
                  aria-label="Pilih mode eksekusi API"
                  className="flex items-center bg-[#F4F3EF] dark:bg-zinc-950 p-1 border-2 border-zinc-950 dark:border-zinc-500"
                >
                  <button
                    type="button"
                    onClick={() => setExecutionMode('live')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      executionMode === 'live'
                        ? 'bg-[#B8FF01] text-zinc-950'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    Live API
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('simulate')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      executionMode === 'simulate'
                        ? 'bg-[#B8FF01] text-zinc-950'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    Simulasi
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Quick Navigation Strip (Visible on Mobile < md) */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <a
              href="#workspace"
              className="py-2.5 px-3 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-center font-mono text-xs font-bold text-zinc-950 dark:text-white"
            >
              01. Workspace
            </a>
            <a
              href="#riwayat"
              className="py-2.5 px-3 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-center font-mono text-xs font-bold text-zinc-950 dark:text-white"
            >
              02. Riwayat ({history.length})
            </a>
            <a
              href="#endpoints"
              className="py-2.5 px-3 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-500 text-center font-mono text-xs font-bold text-zinc-950 dark:text-white"
            >
              03. Info Vercel
            </a>
          </div>

          {/* 1-Click Auto-Pilot & Publish Diagnostics Bar */}
          <ProductionDiagnosticsBar
            isRunningAutoPilot={isRunningAutoPilot}
            autoPilotStage={autoPilotStage}
            onRunFullAutoPilot={handleRunFullAutoPilot}
          />

          {/* 2-Column Asymmetric Brutalist Split: Left = Action Forms, Right = Certificate Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column (7 cols): Interactive Step 01 & Step 02 Forms */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg flex flex-col justify-between">
              {/* Step Selector Tabs */}
              <div
                role="tablist"
                aria-label="Tahapan Aktivasi Alight Motion Pro"
                className="grid grid-cols-2 border-b-2 border-zinc-950 dark:border-zinc-700 bg-[#F4F3EF] dark:bg-zinc-950"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeStep === 'send'}
                  onClick={() => setActiveStep('send')}
                  className={`py-4 px-4 sm:px-6 text-left border-r-2 border-zinc-950 dark:border-zinc-700 transition-colors cursor-pointer ${
                    activeStep === 'send'
                      ? 'bg-[#B8FF01] text-zinc-950'
                      : 'bg-[#F4F3EF] dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold">LANGKAH 01</span>
                    <Send className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="font-display text-base sm:text-lg font-extrabold mt-0.5 truncate">
                    01. Pilih Email &amp; Kirim Link
                  </div>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeStep === 'verify'}
                  onClick={() => setActiveStep('verify')}
                  className={`py-4 px-4 sm:px-6 text-left transition-colors cursor-pointer ${
                    activeStep === 'verify'
                      ? 'bg-[#B8FF01] text-zinc-950'
                      : 'bg-[#F4F3EF] dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold">LANGKAH 02</span>
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="font-display text-base sm:text-lg font-extrabold mt-0.5 truncate">
                    02. Verifikasi &amp; Aktivasi
                  </div>
                </button>
              </div>

              {/* Active Form Body */}
              <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                {/* Dual Feature Selector: Email Pribadi vs Email Random (emailqu.com) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    <span>PILIH METODE SUMBER EMAIL</span>
                    <span>2 FITUR AKTIF</span>
                  </div>
                  <div
                    role="group"
                    aria-label="Pilih metode sumber email"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEmailSourceMode('personal');
                        setSendError(null);
                      }}
                      className={`p-3.5 border-2 border-zinc-950 dark:border-zinc-500 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        emailSourceMode === 'personal'
                          ? 'bg-zinc-950 dark:bg-[#B8FF01] text-white dark:text-zinc-950 brutal-shadow-sm'
                          : 'bg-[#F4F3EF] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700'
                      }`}
                    >
                      <User
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          emailSourceMode === 'personal'
                            ? 'text-[#B8FF01] dark:text-zinc-950'
                            : 'text-zinc-950 dark:text-[#B8FF01]'
                        }`}
                      />
                      <div>
                        <div className="font-display text-sm font-extrabold">
                          Fitur 1: Email Pribadi
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            emailSourceMode === 'personal'
                              ? 'text-zinc-300 dark:text-zinc-800'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          Input manual email milik Anda sendiri
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailSourceMode('random');
                        setSendError(null);
                      }}
                      className={`p-3.5 border-2 border-zinc-950 dark:border-zinc-500 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        emailSourceMode === 'random'
                          ? 'bg-zinc-950 dark:bg-[#B8FF01] text-white dark:text-zinc-950 brutal-shadow-sm'
                          : 'bg-[#F4F3EF] dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Dices
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          emailSourceMode === 'random'
                            ? 'text-[#B8FF01] dark:text-zinc-950'
                            : 'text-zinc-950 dark:text-[#B8FF01]'
                        }`}
                      />
                      <div>
                        <div className="font-display text-sm font-extrabold">
                          Fitur 2: Email Random (EmailQu)
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            emailSourceMode === 'random'
                              ? 'text-zinc-300 dark:text-zinc-800'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          Generate otomatis + Notifikasi Inbox
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {activeStep === 'send' ? (
                  <form
                    key="form-send"
                    onSubmit={handleSendSubmit}
                    noValidate
                    className="space-y-6 animate-brutal-in"
                  >
                    {emailSourceMode === 'personal' ? (
                      /* FITUR 1: EMAIL PRIBADI */
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                            MODE: EMAIL PRIBADI · ENDPOINT: GET /tools/am-send
                          </div>
                          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white">
                            01. Kirim Magic Link ke Email Pribadi
                          </h2>
                          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Ketik alamat email pribadi Anda di bawah ini. Sistem akan mengirimkan tautan masuk Alight Motion langsung ke kotak masuk email Anda.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="input-send-email"
                            className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5"
                          >
                            <Mail className="w-4 h-4 text-zinc-950 dark:text-[#B8FF01]" />
                            <span>Alamat Email Pribadi Anda</span>
                          </label>

                          <input
                            id="input-send-email"
                            type="email"
                            value={personalEmail}
                            onChange={(e) => {
                              setPersonalEmail(e.target.value);
                              if (sendError) setSendError(null);
                            }}
                            placeholder="Ketik alamat email Anda (misal: nama@domain.com)"
                            className="w-full px-4 py-3 bg-[#F4F3EF] dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-500 font-mono text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      /* FITUR 2: EMAIL RANDOM GENERATOR + LIVE INBOX (EMAILQU.COM) */
                      <EmailQuPanel
                        generatedEmail={randomEmail}
                        domains={emailQuDomains}
                        messages={inboxMessages}
                        isGenerating={isGeneratingEmail}
                        isPollingInbox={isPollingInbox}
                        autoRefresh={autoRefreshInbox}
                        latestNotification={latestNotification}
                        onGenerateNew={handleGenerateRandomEmail}
                        onRefreshInbox={handlePollInbox}
                        onToggleAutoRefresh={() => setAutoRefreshInbox((v) => !v)}
                        onSimulateIncomingMail={() => handleSimulateIncomingMail()}
                        onUseMagicLinkFromMail={handleUseMagicLinkFromMail}
                        onDismissNotification={() => setLatestNotification(null)}
                      />
                    )}

                    {/* Live Request Preview Box */}
                    <div className="border-2 border-zinc-950 dark:border-zinc-600 bg-[#F4F3EF] dark:bg-zinc-800 p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
                        <span>PREVIEW TARGET ENDPOINT (AM-SEND)</span>
                        <span>HTTP GET</span>
                      </div>
                      <p
                        data-testid="preview-send-url"
                        className="font-mono text-xs text-zinc-950 dark:text-[#B8FF01] break-all select-all"
                      >
                        {buildAmSendEndpoint(activeEmail)}
                      </p>
                    </div>

                    {/* Validation Error Alert */}
                    {sendError && (
                      <div
                        role="alert"
                        className="p-4 bg-red-50 dark:bg-red-950/60 border-2 border-zinc-950 dark:border-red-500 text-red-900 dark:text-red-200 flex items-start gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs font-medium leading-relaxed">
                          <p className="font-bold">Validasi Gagal</p>
                          <p>{sendError}</p>
                        </div>
                      </div>
                    )}

                    {/* Success Alert */}
                    {sendSuccessMsg && (
                      <div
                        role="status"
                        className="p-4 bg-[#B8FF01] border-2 border-zinc-950 text-zinc-950 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold text-sm">
                              Permintaan Magic Link Terkirim
                            </p>
                            <p className="mt-0.5">{sendSuccessMsg}</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setActiveStep('verify')}
                            className="px-4 py-2 bg-zinc-950 text-white text-xs font-bold inline-flex items-center gap-1.5 brutal-btn cursor-pointer"
                          >
                            <span>Lanjut ke Langkah 02 (Verifikasi)</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#B8FF01]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submit Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveStep('verify')}
                        className="px-4 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white inline-flex items-center gap-2 brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Sudah Punya Magic Link?</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="submit"
                        disabled={isSending || isGeneratingEmail}
                        className="px-6 py-3 bg-zinc-950 dark:bg-[#B8FF01] hover:bg-zinc-800 disabled:opacity-60 text-[#B8FF01] dark:text-zinc-950 border-2 border-zinc-950 text-sm font-extrabold inline-flex items-center gap-2 brutal-btn brutal-shadow whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengirim Magic Link...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Kirim Magic Link Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form
                    key="form-verify"
                    onSubmit={handleVerifySubmit}
                    noValidate
                    className="space-y-5 animate-brutal-in"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                        ENDPOINT: GET /tools/am-verify
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white">
                        02. Verifikasi Magic Link &amp; Aktivasi Pro
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        Tempelkan URL tautan masuk dari email Alight Motion (<code className="font-mono text-zinc-950 dark:text-[#B8FF01]">https://alight-creative.firebaseapp.com/__/auth/links?link=...</code>) untuk memvalidasi token dan mengaktifkan langganan Pro.
                      </p>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-verify-email"
                        className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-950 dark:text-[#B8FF01]" />
                        <span>
                          Alamat Email Target ({emailSourceMode === 'random' ? 'EmailQu Random' : 'Email Pribadi'})
                        </span>
                      </label>
                      <input
                        id="input-verify-email"
                        type="email"
                        value={activeEmail}
                        onChange={(e) => {
                          setActiveEmail(e.target.value);
                          if (verifyError) setVerifyError(null);
                        }}
                        placeholder="Ketik alamat email yang menerima Magic Link..."
                        className="w-full px-3.5 py-2.5 bg-[#F4F3EF] dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-500 font-mono text-xs sm:text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none"
                      />
                    </div>

                    {/* Magic Link Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="input-magic-link"
                          className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5"
                        >
                          <Link2 className="w-3.5 h-3.5 text-zinc-950 dark:text-[#B8FF01]" />
                          <span>Tautan Magic Link (Firebase Auth URL)</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePasteClipboard}
                            className="px-2.5 py-1 bg-[#F4F3EF] dark:bg-zinc-800 hover:bg-zinc-200 border border-zinc-950 dark:border-zinc-500 text-xs font-semibold text-zinc-950 dark:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardPaste className="w-3 h-3" />
                            <span>Tempel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMagicLink(SAMPLE_MAGIC_LINK);
                              setVerifyError(null);
                            }}
                            className="px-2.5 py-1 bg-[#B8FF01] border border-zinc-950 text-xs font-bold text-zinc-950 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3 h-3" />
                            <span>Isi Format Token Contoh</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        id="input-magic-link"
                        rows={3}
                        value={magicLink}
                        onChange={(e) => {
                          setMagicLink(e.target.value);
                          if (verifyError) setVerifyError(null);
                        }}
                        placeholder="Tempel tautan https://alight-creative.firebaseapp.com/__/auth/links?link=..."
                        className="w-full p-3 bg-[#F4F3EF] dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-500 font-mono text-xs text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Real-time Magic Link Token Inspector */}
                    <div className="border-2 border-zinc-950 dark:border-zinc-600 bg-[#F4F3EF] dark:bg-zinc-800 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-zinc-950 dark:text-[#B8FF01]" />
                          <span>INSPEKSI PARAMETER MAGIC LINK</span>
                        </span>
                        <span className="text-zinc-700 dark:text-[#B8FF01] font-semibold">
                          {linkInspection.isValid ? 'TOKEN TERDETEKSI' : 'MENUNGGU INPUT URL'}
                        </span>
                      </div>

                      {linkInspection.isValid ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-600 p-2">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                              AUTH HOST
                            </span>
                            <span className="font-semibold text-zinc-950 dark:text-white truncate block">
                              {linkInspection.host}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-600 p-2">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                              OOB CODE (TOKEN)
                            </span>
                            <span
                              data-testid="inspected-oobcode"
                              className="font-semibold text-zinc-950 dark:text-[#B8FF01] truncate block"
                            >
                              {linkInspection.oobCode || 'Terenkapsulasi'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-950 dark:border-zinc-600 p-2">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                              MODE &amp; BAHASA
                            </span>
                            <span className="font-semibold text-zinc-950 dark:text-white truncate block">
                              {linkInspection.mode} · {linkInspection.lang}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
                          Tempelkan URL Magic Link atau klik &quot;Pakai Magic Link&quot; dari notifikasi kotak masuk EmailQu untuk mengekstrak oobCode otomatis.
                        </p>
                      )}
                    </div>

                    {/* Error Message */}
                    {verifyError && (
                      <div
                        role="alert"
                        className="p-3.5 bg-red-50 dark:bg-red-950/60 border-2 border-zinc-950 dark:border-red-500 text-red-900 dark:text-red-200 flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-bold">Verifikasi Ditolak</p>
                          <p>{verifyError}</p>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {verifySuccessMsg && (
                      <div
                        role="status"
                        className="p-3.5 bg-[#B8FF01] border-2 border-zinc-950 text-zinc-950 flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
                        <div className="text-xs font-semibold">
                          {verifySuccessMsg}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEmail('');
                          setMagicLink('');
                          setVerifyError(null);
                          setVerifySuccessMsg(null);
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 border-2 border-zinc-950 dark:border-zinc-500 text-xs font-bold text-zinc-950 dark:text-white brutal-btn whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Bersihkan Form
                      </button>

                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="px-6 py-3 bg-[#B8FF01] hover:bg-[#a6e600] disabled:opacity-60 text-zinc-950 border-2 border-zinc-950 text-sm font-extrabold inline-flex items-center gap-2 brutal-btn brutal-shadow whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memverifikasi Token...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Verifikasi &amp; Aktifkan Pro</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): Verified Certificate & JSON Payload Card */}
            <div className="lg:col-span-5 flex flex-col">
              <CertificateCard
                result={currentResult}
                lastEndpointUrl={lastEndpointUrl}
                isSimulating={executionMode === 'simulate' || usedFallback}
              />
            </div>
          </div>
        </section>

        {/* 3-Step Mechanism-to-Outcome Workflow Strip */}
        <section
          id="alur-kerja"
          aria-labelledby="heading-workflow"
          className="bg-zinc-950 text-white border-2 border-zinc-950 dark:border-zinc-200 brutal-shadow-lg p-5 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="text-xs font-mono text-[#B8FF01]">
                ARSITEKTUR OTENTIKASI · {DEVELOPER_NAME}
              </div>
              <h2
                id="heading-workflow"
                className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1"
              >
                Cara Kerja Dual-Mode &amp; Auto-Pilot 1-Klik
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Kuota Harian Server: 10 Aktivasi / 24 Jam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-zinc-900 border-2 border-zinc-700 p-5 space-y-2">
              <div className="flex items-center justify-between text-[#B8FF01] font-mono text-xs font-bold">
                <span>TAHAP 01</span>
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                01. Pilih Email Pribadi atau Random
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Gunakan email pribadi Anda atau buat alamat email instan dari{' '}
                <code className="font-mono text-[#B8FF01]">emailqu.com</code>, lalu klik Kirim Magic Link.
              </p>
            </div>

            <div className="bg-zinc-900 border-2 border-zinc-700 p-5 space-y-2">
              <div className="flex items-center justify-between text-[#B8FF01] font-mono text-xs font-bold">
                <span>TAHAP 02</span>
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                02. Terima Notifikasi &amp; Ekstrak Token
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Jika memakai Email Random, pesan masuk akan tampil langsung di panel notifikasi web ini beserta tombol ekstraksi Magic Link otomatis.
              </p>
            </div>

            <div className="bg-zinc-900 border-2 border-zinc-700 p-5 space-y-2">
              <div className="flex items-center justify-between text-[#B8FF01] font-mono text-xs font-bold">
                <span>TAHAP 03</span>
                <FileCode2 className="w-4 h-4" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                03. Injeksi Lisensi &amp; Kirim ke HP
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Endpoint <code className="font-mono text-[#B8FF01]">/tools/am-verify</code> mengaktifkan paket{' '}
                <strong>Alight Motion Pro / Member</strong> lengkap dengan fitur salin bukti teks WA/Telegram &amp; ekspor CSV.
              </p>
            </div>
          </div>
        </section>

        {/* Section 03: Activation History */}
        <HistorySection
          items={history}
          onSelectRecord={handleSelectHistoryRecord}
          onDeleteRecord={handleDeleteHistoryRecord}
          onSwitchToRandomGenerator={handleSwitchToRandomMode}
        />

        {/* Section 04: Endpoint Specification & Vercel Deployment */}
        <EndpointDocsSection
          currentEmail={activeEmail}
          currentMagicLink={magicLink}
        />
      </main>

      {/* Quiet Brutalist Footer with Official Developer Attribution */}
      <footer className="relative z-10 bg-white dark:bg-zinc-950 border-t-2 border-zinc-950 dark:border-[#B8FF01] px-4 sm:px-8 py-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="font-bold text-zinc-950 dark:text-[#B8FF01]">AMPREM.STUDIO</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-bold text-zinc-950 dark:text-white">
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer: {DEVELOPER_NAME}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>API Creator: Rin imup</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#workspace" className="hover:text-zinc-950 dark:hover:text-[#B8FF01] underline-offset-4 hover:underline">
              Workspace
            </a>
            <a href="#riwayat" className="hover:text-zinc-950 dark:hover:text-[#B8FF01] underline-offset-4 hover:underline">
              Riwayat
            </a>
            <a href="#endpoints" className="hover:text-zinc-950 dark:hover:text-[#B8FF01] underline-offset-4 hover:underline">
              Konfigurasi Vercel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
