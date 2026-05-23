import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ── Inject global styles ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #04071a;
    font-family: 'Inter', sans-serif;
    color: #c9d6f0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root { min-height: 100vh; }

  .orb {
    position: fixed; border-radius: 50%; filter: blur(120px);
    pointer-events: none; z-index: 0;
  }
  .orb-1 { width: 600px; height: 600px; background: #0d3a8a22; top: -200px; left: -150px; }
  .orb-2 { width: 500px; height: 500px; background: #0a5c5222; top: 40%; right: -100px; }
  .orb-3 { width: 400px; height: 400px; background: #1a0d5c18; bottom: -100px; left: 30%; }

  .glass {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .glass-strong {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
  }

  header {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 40px;
    background: rgba(4,7,26,0.7);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(20px);
  }

  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: linear-gradient(135deg, #0f4c8a, #0d9488);
    display: flex; align-items: center; justify-content: center;
  }
  .brand-name {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
    letter-spacing: -0.5px; color: #fff;
  }
  .brand-name span { color: #2dd4bf; }
  .brand-sub { font-size: 11px; color: #4a6080; letter-spacing: 0.04em; margin-top: 1px; }

  .status-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 100px;
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.2);
    font-size: 11px; color: #2dd4bf; font-weight: 500; letter-spacing: 0.06em;
  }
  .pulse-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #2dd4bf;
    animation: pulse-anim 2s ease-in-out infinite;
  }
  @keyframes pulse-anim {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  main {
    position: relative; z-index: 1;
    max-width: 1400px; margin: 0 auto;
    padding: 32px 40px;
    display: grid;
    grid-template-columns: 440px 1fr;
    gap: 28px;
  }

  /* Upload Panel */
  .upload-panel { display: flex; flex-direction: column; gap: 20px; }

  .panel-card {
    border-radius: 20px;
    padding: 24px;
  }

  .panel-label {
    font-family: 'Syne', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
    color: #2dd4bf; text-transform: uppercase; margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .panel-label::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(45,212,191,0.3), transparent);
  }

  /* ── Mode Tabs ── */
  .mode-tabs {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-bottom: 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 5px;
  }
  .mode-tab {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.05em; border: none;
    transition: all 0.2s ease; color: #3a5070; background: transparent;
  }
  .mode-tab.active {
    background: linear-gradient(135deg, rgba(15,76,138,0.7), rgba(13,148,136,0.7));
    color: #fff; border: 1px solid rgba(45,212,191,0.2);
  }
  .mode-tab:not(.active):hover { color: #8ab4d4; background: rgba(255,255,255,0.03); }

  /* Dropzone */
  .dropzone {
    border: 1.5px dashed rgba(255,255,255,0.1);
    border-radius: 16px;
    min-height: 220px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.25s ease;
    overflow: hidden; position: relative;
    background: rgba(255,255,255,0.02);
  }
  .dropzone:hover, .dropzone.active {
    border-color: rgba(45,212,191,0.5);
    background: rgba(45,212,191,0.04);
  }
  .dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 2; }

  .upload-inner { text-align: center; padding: 32px 20px; }
  .upload-circle {
    width: 68px; height: 68px; border-radius: 50%; margin: 0 auto 18px;
    background: linear-gradient(135deg, rgba(15,76,138,0.5), rgba(13,148,136,0.5));
    border: 1px solid rgba(45,212,191,0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .upload-title { font-size: 14px; color: #c9d6f0; font-weight: 500; margin-bottom: 6px; }
  .upload-title span { color: #2dd4bf; }
  .upload-formats { font-size: 11px; color: #3a5070; letter-spacing: 0.05em; }

  .preview-img { width: 100%; height: 220px; object-fit: cover; display: block; border-radius: 14px; }
  .preview-replace {
    position: absolute; inset: 0; z-index: 3;
    background: rgba(4,7,26,0.6);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s; border-radius: 14px;
    font-size: 13px; color: #2dd4bf; font-weight: 500; letter-spacing: 0.05em;
  }
  .dropzone:hover .preview-replace { opacity: 1; }

  /* ── Live Map Panel ── */
  .map-container {
    border-radius: 16px; overflow: hidden; position: relative;
    border: 1px solid rgba(255,255,255,0.08);
  }
  #leaflet-map { width: 100%; height: 260px; background: #0a0f1e; }

  /* Override leaflet controls to match dark theme */
  .leaflet-control-zoom a {
    background: rgba(10,15,30,0.9) !important;
    color: #2dd4bf !important;
    border-color: rgba(45,212,191,0.2) !important;
  }
  .leaflet-control-zoom a:hover { background: rgba(45,212,191,0.15) !important; }

  .map-search-row {
    display: flex; gap: 8px; margin-bottom: 12px;
  }
  .map-search-input {
    flex: 1; padding: 10px 14px; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #c9d6f0; font-size: 12px; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .map-search-input:focus { border-color: rgba(45,212,191,0.4); }
  .map-search-input::placeholder { color: #3a5070; }

  .map-search-btn {
    padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer;
    background: rgba(45,212,191,0.12); border: 1px solid rgba(45,212,191,0.2);
    color: #2dd4bf; font-size: 12px; font-weight: 600; font-family: 'Syne', sans-serif;
    transition: all 0.2s;
  }
  .map-search-btn:hover { background: rgba(45,212,191,0.2); }

  .map-layer-row {
    display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;
  }
  .layer-chip {
    padding: 5px 11px; border-radius: 100px; cursor: pointer;
    font-size: 10px; font-weight: 600; font-family: 'Syne', sans-serif;
    letter-spacing: 0.06em; border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03); color: #4a6080;
    transition: all 0.2s;
  }
  .layer-chip.active {
    background: rgba(45,212,191,0.12); border-color: rgba(45,212,191,0.3);
    color: #2dd4bf;
  }
  .layer-chip:hover:not(.active) { color: #8ab4d4; border-color: rgba(255,255,255,0.15); }

  /* ── Weather overlay section ── */
  .overlay-section-label {
    font-size: 9px; color: #2a4060; letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 6px; font-family: 'Syne', sans-serif; font-weight: 700;
  }
  .map-layer-row.overlays { margin-top: 4px; margin-bottom: 8px; }
  .layer-chip.weather-active {
    background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.4);
    color: #60a5fa;
  }
  .layer-chip.weather-active:hover { color: #93c5fd; }

  .capture-btn {
    width: 100%; padding: 11px; border-radius: 12px; border: none; cursor: pointer;
    background: rgba(45,212,191,0.08);
    border: 1px solid rgba(45,212,191,0.2);
    color: #2dd4bf; font-size: 12px; font-weight: 700;
    font-family: 'Syne', sans-serif; letter-spacing: 0.06em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s; margin-top: 12px;
  }
  .capture-btn:hover { background: rgba(45,212,191,0.15); transform: translateY(-1px); }
  .capture-btn:active { transform: translateY(0); }
  .capture-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .map-coords {
    font-size: 10px; color: #2a4060; text-align: center; margin-top: 6px;
    font-family: 'Inter', sans-serif; letter-spacing: 0.04em;
  }

  .captured-preview {
    border-radius: 12px; overflow: hidden; margin-top: 12px;
    border: 1px solid rgba(45,212,191,0.2); position: relative;
  }
  .captured-preview img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .captured-label {
    position: absolute; top: 8px; left: 8px;
    background: rgba(4,7,26,0.8); border: 1px solid rgba(45,212,191,0.3);
    padding: 3px 8px; border-radius: 6px;
    font-size: 9px; font-weight: 700; color: #2dd4bf;
    font-family: 'Syne', sans-serif; letter-spacing: 0.08em;
  }

  /* Analyze button */
  .analyze-btn {
    width: 100%; padding: 15px 24px; border-radius: 14px; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.06em;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.2s ease;
  }
  .analyze-btn.ready {
    background: linear-gradient(135deg, #0f4c8a, #0d9488);
    color: #fff;
  }
  .analyze-btn.ready:hover { transform: translateY(-1px); filter: brightness(1.1); }
  .analyze-btn.ready:active { transform: translateY(0); }
  .analyze-btn.loading { background: rgba(255,255,255,0.05); color: #3a5070; border: 1px solid rgba(255,255,255,0.07); cursor: not-allowed; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { animation: spin 0.9s linear infinite; }

  /* Stats strip */
  .stats-strip {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .stat-item {
    padding: 16px 18px;
    background: rgba(255,255,255,0.025);
  }
  .stat-label { font-size: 10px; color: #3a5070; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 5px; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #8ab4d4; }

  /* Output area */
  .output-area { display: flex; flex-direction: column; }

  /* Empty state */
  .empty-state {
    flex: 1; min-height: 540px; border-radius: 24px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 60px 40px;
    position: relative; overflow: hidden;
  }
  .empty-bg-ring {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    border: 1px solid rgba(45,212,191,0.06);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .empty-bg-ring:nth-child(2) { width: 450px; height: 450px; border-color: rgba(45,212,191,0.03); }
  .empty-bg-ring:nth-child(3) { width: 600px; height: 600px; border-color: rgba(45,212,191,0.015); }
  .empty-icon-wrap {
    width: 80px; height: 80px; border-radius: 24px; margin: 0 auto 24px;
    background: rgba(13,148,136,0.1); border: 1px solid rgba(45,212,191,0.15);
    display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;
  }
  .empty-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #e2eaf8; margin-bottom: 12px; position: relative; z-index: 1; }
  .empty-desc { font-size: 13px; color: #3a5070; max-width: 300px; line-height: 1.8; position: relative; z-index: 1; }

  /* Loading state */
  .loading-state {
    flex: 1; min-height: 540px; border-radius: 24px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 60px;
  }
  .scan-wrap { position: relative; width: 100px; height: 100px; margin-bottom: 32px; }
  .scan-ring-outer {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid rgba(45,212,191,0.15);
    border-top-color: #2dd4bf;
    animation: spin 1.3s linear infinite;
  }
  .scan-ring-mid {
    position: absolute; inset: 12px; border-radius: 50%;
    border: 1px dashed rgba(45,212,191,0.2);
    animation: spin 3s linear infinite reverse;
  }
  .scan-core {
    position: absolute; inset: 24px; border-radius: 50%;
    background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
    color: #2dd4bf; letter-spacing: 0.1em;
  }
  .loading-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #e2eaf8; margin-bottom: 8px; }
  .loading-sub { font-size: 13px; color: #3a5070; margin-bottom: 32px; }
  .loading-steps { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 360px; }
  .loading-step { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
  .step-num { width: 24px; height: 24px; border-radius: 8px; background: rgba(45,212,191,0.1); border: 1px solid rgba(45,212,191,0.2); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #2dd4bf; font-family: 'Syne', sans-serif; flex-shrink: 0; }
  .step-text { font-size: 12px; color: #4a6080; }

  /* Report */
  .report-wrap { display: flex; flex-direction: column; gap: 20px; }
  .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .metric-card { border-radius: 20px; padding: 22px 24px; position: relative; overflow: hidden; }
  .metric-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .metric-card.teal::before { background: linear-gradient(90deg, #2dd4bf, transparent); }
  .metric-card.blue::before { background: linear-gradient(90deg, #60a5fa, transparent); }
  .metric-tag { font-size: 10px; color: #3a5070; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
  .metric-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 6px; line-height: 1.2; }
  .metric-val.teal { color: #2dd4bf; }
  .metric-val.blue { color: #60a5fa; }
  .metric-sub { font-size: 11px; color: #3a5070; }

  .ai-card { border-radius: 20px; overflow: hidden; }
  .ai-header {
    padding: 18px 24px;
    background: rgba(45,212,191,0.05);
    border-bottom: 1px solid rgba(45,212,191,0.1);
    display: flex; align-items: center; gap: 10px;
  }
  .ai-header-icon {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(15,76,138,0.6), rgba(13,148,136,0.6));
    display: flex; align-items: center; justify-content: center;
  }
  .ai-header-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #e2eaf8; letter-spacing: 0.05em; }
  .ai-header-sub { font-size: 11px; color: #3a5070; }
  .ai-section { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .ai-section:last-child { border-bottom: none; }
  .ai-section-label { font-size: 10px; color: #2dd4bf; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; margin-bottom: 10px; }
  .ai-section-text { font-size: 13px; color: #8ab4d4; line-height: 1.85; font-weight: 300; }
  .rec-list { display: flex; flex-direction: column; gap: 10px; }
  .rec-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
  .rec-num { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; color: #2dd4bf; min-width: 20px; }
  .rec-text { font-size: 12px; color: #6a8fad; line-height: 1.7; }

  .risk-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .risk-card { border-radius: 16px; padding: 18px 20px; position: relative; overflow: hidden; }
  .risk-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .risk-card.amber::before { background: linear-gradient(90deg, #f59e0b, transparent); }
  .risk-card.red::before   { background: linear-gradient(90deg, #ef4444, transparent); }
  .risk-card.purple::before{ background: linear-gradient(90deg, #a78bfa, transparent); }
  .risk-label { font-size: 10px; color: #3a5070; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .risk-val   { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .risk-val.amber  { color: #f59e0b; }
  .risk-val.red    { color: #ef4444; }
  .risk-val.purple { color: #a78bfa; }
  .risk-sub { font-size: 10px; color: #3a5070; margin-top: 4px; }

  /* ── Weather Prediction Card ── */
  .weather-card { border-radius: 20px; overflow: hidden; }
  .weather-header {
    padding: 16px 24px;
    background: rgba(96,165,250,0.06);
    border-bottom: 1px solid rgba(96,165,250,0.12);
    display: flex; align-items: center; gap: 10px;
  }
  .weather-header-icon {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(30,64,175,0.6), rgba(37,99,235,0.6));
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .weather-header-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #e2eaf8; letter-spacing: 0.05em; }
  .weather-header-sub { font-size: 11px; color: #3a5070; }
  .weather-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: rgba(255,255,255,0.04);
  }
  .weather-stat {
    padding: 16px 18px;
    background: rgba(10,15,40,0.6);
  }
  .weather-stat-label { font-size: 9px; color: #2a4060; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; font-family: 'Syne', sans-serif; font-weight: 700; }
  .weather-stat-val { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #93c5fd; line-height: 1.3; }
  .weather-summary-section { padding: 16px 24px; border-top: 1px solid rgba(96,165,250,0.08); }
  .weather-summary-text { font-size: 12px; color: #4a6a8a; line-height: 1.8; }

  .alert-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 100px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; font-family: 'Syne', sans-serif;
  }
  .alert-LOW      { background: rgba(45,212,191,0.1);  color: #2dd4bf;  border: 1px solid rgba(45,212,191,0.3); }
  .alert-MEDIUM   { background: rgba(245,158,11,0.1);  color: #f59e0b;  border: 1px solid rgba(245,158,11,0.3); }
  .alert-HIGH     { background: rgba(239,68,68,0.1);   color: #f87171;  border: 1px solid rgba(239,68,68,0.3); }
  .alert-CRITICAL { background: rgba(167,139,250,0.1); color: #a78bfa;  border: 1px solid rgba(167,139,250,0.3); }

  .flag-list { display: flex; flex-direction: column; gap: 8px; }
  .flag-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 10px; background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.12); font-size: 12px; color: #92784a; }
  .flag-icon { color: #f59e0b; font-size: 14px; flex-shrink: 0; margin-top: 1px; }

  .pipeline-strip {
    border-radius: 16px; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  }
  .pipeline-agents { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .agent-chip {
    padding: 4px 10px; border-radius: 100px;
    background: rgba(45,212,191,0.07); border: 1px solid rgba(45,212,191,0.15);
    font-size: 10px; color: #2dd4bf; font-family: 'Syne', sans-serif; font-weight: 600;
  }
  .agent-arrow { font-size: 10px; color: #1a3050; }
  .pipeline-model { font-size: 10px; color: #3a5070; letter-spacing: 0.05em; }

  .cache-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 100px; font-size: 10px;
    background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); color: #60a5fa;
  }

  .score-bar-track { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.06); margin-top: 10px; overflow: hidden; }
  .score-bar-fill  { height: 100%; border-radius: 2px; transition: width 0.8s ease; }

  /* Location info bar */
  .location-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    background: rgba(45,212,191,0.05); border: 1px solid rgba(45,212,191,0.12);
    margin-bottom: 12px;
  }
  .location-dot { width: 6px; height: 6px; border-radius: 50%; background: #2dd4bf; flex-shrink: 0; }
  .location-text { font-size: 11px; color: #4a7090; flex: 1; }
  .location-coords { font-size: 10px; color: #2a5070; font-family: 'Inter', sans-serif; letter-spacing: 0.04em; }
`;

if (!document.getElementById('eco-styles')) {
  const s = document.createElement('style');
  s.id = 'eco-styles';
  s.textContent = css;
  document.head.appendChild(s);
}
if (!document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

/* ── Load Leaflet dynamically ── */
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

/* ── Map tile layers ── */
const LAYERS = {
  Satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  Street:    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  Topo:      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  Dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const LAYER_ATTR = {
  Satellite: '© Esri',
  Street:    '© OpenStreetMap contributors',
  Topo:      '© OpenTopoMap',
  Dark:      '© CartoDB',
};

/* ── Weather overlay layers (OpenWeatherMap free tiles — no API key needed for basic) ── */
const OWM_APP_ID = ''; // Leave blank — OWM tiles work without key at low zoom for demo
const WEATHER_OVERLAYS = {
  None:          null,
  Clouds:        'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
  Precipitation: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
  Wind:          'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
  Temperature:   'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
  Pressure:      'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
};

const OVERLAY_ICONS = {
  None:          '○',
  Clouds:        '☁',
  Precipitation: '🌧',
  Wind:          '💨',
  Temperature:   '🌡',
  Pressure:      '⊙',
};

/* ── Icons ── */
const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

const UploadIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

const ScanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3 3m12 6V4.5M15 9h4.5M15 9l6-6M9 15v4.5M9 15H4.5M9 15l-6 6m12-6v4.5M15 15h4.5M15 15l6 6" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const AIIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 9l-3.382-3.382-7.805 10.286z" />
  </svg>
);

const SatelliteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5M21 19.5H3.75M6.75 12l3-3 2.25 2.25L15 7.5" />
    <circle cx="18" cy="6" r="3" strokeWidth="1.5" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const CameraIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

/* ── Helpers ── */
const riskColor = (score) => {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#2dd4bf';
  return '#60a5fa';
};

/* ── Live Map Component ── */
function LiveMapPanel({ onCapture }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('Dark');
  const [activeOverlay, setActiveOverlay] = useState('None');
  const [searchQuery, setSearchQuery] = useState('');
  const [center, setCenter] = useState({ lat: 39.8283, lng: -98.5795 });
  const [zoom, setZoom] = useState(4);
  const [capturing, setCapturing] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);

  // Init map
  useEffect(() => {
    let mounted = true;
    // Small delay ensures the DOM element is rendered and sized before Leaflet attaches
    const initMap = async () => {
      await new Promise(r => setTimeout(r, 100));
      const L = await loadLeaflet();
      if (!mounted || !mapRef.current || mapInstanceRef.current) return;
      // Force the container to have a real pixel height before init
      mapRef.current.style.height = '260px';
      const map = L.map(mapRef.current, {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });
      // Start with Dark layer (CORS-friendly for capture)
      const tile = L.tileLayer(LAYERS['Dark'], {
        maxZoom: 18,
        attribution: LAYER_ATTR['Dark'],
      }).addTo(map);
      tileLayerRef.current = tile;
      mapInstanceRef.current = map;
      setActiveLayer('Dark');
      // Force Leaflet to recalculate tile positions after mount
      setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 300);
      map.on('moveend zoomend', () => {
        const c = map.getCenter();
        setCenter({ lat: parseFloat(c.lat.toFixed(4)), lng: parseFloat(c.lng.toFixed(4)) });
        setZoom(map.getZoom());
      });
    };
    initMap();
    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch layer
  const switchLayer = useCallback((name) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    setActiveLayer(name);
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(LAYERS[name], {
      maxZoom: 18,
      attribution: LAYER_ATTR[name],
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
    // Re-add overlay on top if one is active
    if (overlayLayerRef.current) {
      overlayLayerRef.current.addTo(mapInstanceRef.current);
    }
  }, []);

  // Toggle weather overlay
  const switchOverlay = useCallback((name) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    // Remove existing overlay
    if (overlayLayerRef.current) {
      mapInstanceRef.current.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }
    if (name === 'None' || name === activeOverlay) {
      setActiveOverlay('None');
      return;
    }
    setActiveOverlay(name);
    const url = WEATHER_OVERLAYS[name];
    if (url) {
      const overlayTile = L.tileLayer(url, { opacity: 0.7, maxZoom: 18 }).addTo(mapInstanceRef.current);
      overlayLayerRef.current = overlayTile;
    }
  }, [activeOverlay]);

  // Search location via Nominatim
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0 && mapInstanceRef.current) {
        const { lat, lon } = data[0];
        mapInstanceRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 10, { duration: 1.2 });
      }
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  // Capture map as image using canvas
  const captureMap = async () => {
    if (!mapInstanceRef.current) return;
    setCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      const mapEl = mapRef.current;
      const rect = mapEl.getBoundingClientRect();
      const W = Math.floor(rect.width) || 400;
      const H = Math.floor(rect.height) || 260;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, W, H);

      // Grab all tile <img> elements currently in the map pane
      const tileImgs = Array.from(mapEl.querySelectorAll('img.leaflet-tile'));
      let tilesDrawn = 0;

      const drawTile = (img) => new Promise((res) => {
        const tileRect = img.getBoundingClientRect();
        const x = Math.round(tileRect.left - rect.left);
        const y = Math.round(tileRect.top - rect.top);
        const w = Math.round(tileRect.width);
        const h = Math.round(tileRect.height);
        // Try drawing directly (works if tiles are CORS-enabled)
        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
          try { ctx.drawImage(probe, x, y, w, h); tilesDrawn++; } catch (_) {}
          res();
        };
        probe.onerror = () => res(); // CORS blocked — skip tile, background shows
        probe.src = img.src + (img.src.includes('?') ? '&' : '?') + '_=' + Date.now();
      });

      await Promise.all(tileImgs.map(drawTile));

      // Coordinate + layer overlay
      ctx.fillStyle = 'rgba(4,7,26,0.75)';
      ctx.fillRect(0, H - 30, W, 30);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `EcoOrbit AI  |  ${activeLayer}${activeOverlay !== 'None' ? ' + ' + activeOverlay : ''}  |  Lat ${center.lat}  Lng ${center.lng}  Zoom ${zoom}`,
        10, H - 10
      );

      if (tilesDrawn === 0) {
        // CORS blocked all tiles — show helpful message in the canvas
        ctx.fillStyle = 'rgba(4,7,26,0.85)';
        ctx.fillRect(0, 0, W, H - 30);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Switch to Dark or Street layer for capture', W/2, H/2 - 12);
        ctx.fillStyle = '#4a6080';
        ctx.font = '11px monospace';
        ctx.fillText('(Satellite tiles block cross-origin canvas export)', W/2, H/2 + 10);
        ctx.textAlign = 'left';
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedUrl(dataUrl);
      canvas.toBlob((blob) => {
        const file = new File(
          [blob],
          `ecoOrbit_${activeLayer}_${center.lat}_${center.lng}.jpg`,
          { type: 'image/jpeg' }
        );
        onCapture(file, dataUrl, { lat: center.lat, lng: center.lng, zoom, layer: activeLayer, weatherOverlay: activeOverlay });
      }, 'image/jpeg', 0.92);
    } catch (e) {
      console.error('Capture failed', e);
      alert('Capture error: ' + e.message);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="map-search-row">
        <input
          className="map-search-input"
          placeholder="Search any location… e.g. New York City"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchLocation()}
        />
        <button className="map-search-btn" onClick={searchLocation}>Go</button>
      </div>

      {/* Layer switcher */}
      <div className="overlay-section-label">Base Layer</div>
      <div className="map-layer-row">
        {Object.keys(LAYERS).map(name => (
          <div
            key={name}
            className={`layer-chip${activeLayer === name ? ' active' : ''}`}
            onClick={() => switchLayer(name)}
          >{name}</div>
        ))}
      </div>

      {/* Weather Overlay switcher */}
      <div className="overlay-section-label">Weather Overlay</div>
      <div className="map-layer-row overlays">
        {Object.keys(WEATHER_OVERLAYS).map(name => (
          <div
            key={name}
            className={`layer-chip${activeOverlay === name && name !== 'None' ? ' weather-active' : ''}`}
            onClick={() => switchOverlay(name)}
            title={name}
          >{OVERLAY_ICONS[name]} {name}</div>
        ))}
      </div>

      {/* Location bar */}
      <div className="location-bar">
        <div className="location-dot" />
        <span className="location-text">
          Navigate to any location on Earth
          {activeOverlay !== 'None' && <span style={{ color: '#60a5fa', marginLeft: 8 }}>· {OVERLAY_ICONS[activeOverlay]} {activeOverlay} overlay active</span>}
        </span>
        <span className="location-coords">{center.lat}, {center.lng} · z{zoom}</span>
      </div>

      {/* Map */}
      <div className="map-container">
        <div id="leaflet-map" ref={mapRef} style={{ width: "100%", height: "260px", background: "#0a0f1e" }} />
      </div>

      {/* Capture button */}
      <button className="capture-btn" onClick={captureMap} disabled={capturing}>
        <CameraIcon />
        {capturing ? 'Capturing map view…' : 'Capture Map & Send to AI'}
      </button>

      {/* Preview of captured frame */}
      {capturedUrl && (
        <div className="captured-preview">
          <img src={capturedUrl} alt="Captured map" />
          <div className="captured-label">CAPTURED — READY FOR AI</div>
        </div>
      )}

      <p className="map-coords" style={{ marginTop: 8 }}>
        💡 Use Dark or Street layer for best capture results. Satellite tiles may show blank due to CORS.
      </p>
    </div>
  );
}

/* ── Main Component ── */
export default function App() {
  const [mode, setMode] = useState('upload'); // 'upload' | 'map'
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [mapMeta, setMapMeta] = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setReport(null);
    setMapMeta(null);
  };

  const handleMapCapture = (file, dataUrl, meta) => {
    setImage(file);
    setPreviewUrl(dataUrl);
    setReport(null);
    setMapMeta(meta);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const triggerAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', image);
    if (mapMeta?.lat != null) formData.append('lat', mapMeta.lat);
    if (mapMeta?.lng != null) formData.append('lon', mapMeta.lng);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (data.status === 'loading') { alert(data.message); setIsAnalyzing(false); }
      else { setReport(data); setIsAnalyzing(false); }
    } catch (err) {
      console.error(err);
      alert('Failed to compile satellite data. Check your API keys and logs.');
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = !!image;

  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <header>
        <div className="brand">
          <div className="brand-icon"><GlobeIcon /></div>
          <div>
            <div className="brand-name">EcoOrbit <span>AI</span></div>
            <div className="brand-sub">Satellite Climate Intelligence Engine</div>
          </div>
        </div>
        <div className="status-badge">
          <div className="pulse-dot" />
          Groq Vision Pipeline Active
        </div>
      </header>

      <main>
        {/* ── Left Column ── */}
        <div className="upload-panel">
          <div className="panel-card glass">
            <div className="panel-label">Target Imagery</div>

            {/* Mode toggle */}
            <div className="mode-tabs">
              <button className={`mode-tab${mode === 'upload' ? ' active' : ''}`} onClick={() => setMode('upload')}>
                <UploadIcon /> Upload File
              </button>
              <button className={`mode-tab${mode === 'map' ? ' active' : ''}`} onClick={() => setMode('map')}>
                <MapPinIcon /> Live Map
              </button>
            </div>

            {/* Upload mode */}
            {mode === 'upload' && (
              <div
                className={`dropzone${dragOver ? ' active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
                {previewUrl && mode === 'upload' ? (
                  <>
                    <img src={previewUrl} className="preview-img" alt="Satellite preview" />
                    <div className="preview-replace">↑ Replace Image</div>
                  </>
                ) : (
                  <div className="upload-inner">
                    <div className="upload-circle"><UploadIcon /></div>
                    <p className="upload-title">Drop file or <span>browse</span></p>
                    <p className="upload-formats">GeoTIFF · PNG · JPEG · Multi-spectral</p>
                  </div>
                )}
              </div>
            )}

            {/* Live Map mode */}
            {mode === 'map' && (
              <LiveMapPanel onCapture={handleMapCapture} />
            )}

            {/* Show capture preview in upload mode if map was used */}
            {mode === 'upload' && mapMeta && previewUrl && (
              <div className="location-bar" style={{ marginTop: 12 }}>
                <div className="location-dot" />
                <span className="location-text">Map capture: {mapMeta.layer} layer</span>
                <span className="location-coords">{mapMeta.lat}, {mapMeta.lng}</span>
              </div>
            )}
          </div>

          {/* Analyze button */}
          {canAnalyze && (
            <button
              className={`analyze-btn ${isAnalyzing ? 'loading' : 'ready'}`}
              onClick={triggerAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? <><SpinnerIcon /> Extracting Spectral Telemetry…</>
                : <><ScanIcon /> Execute Climate AI Parse</>}
            </button>
          )}

          <div className="stats-strip glass">
            <div className="stat-item">
              <div className="stat-label">Vision</div>
              <div className="stat-val">llama-4-scout</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Pipeline</div>
              <div className="stat-val">4-Agent</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Hosting</div>
              <div className="stat-val">Vercel Free</div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="output-area">
          {!report && !isAnalyzing && (
            <div className="empty-state glass">
              <div className="empty-bg-ring" />
              <div className="empty-bg-ring" />
              <div className="empty-bg-ring" />
              <div className="empty-icon-wrap"><SatelliteIcon /></div>
              <div className="empty-title">Awaiting Planetary Feed</div>
              <p className="empty-desc">
                {mode === 'map'
                  ? 'Navigate to any location on the map, capture it, then hit Analyze to run AI climate analysis.'
                  : 'Upload a satellite snapshot or switch to Live Map mode to capture any location on Earth.'}
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="loading-state glass">
              <div className="scan-wrap">
                <div className="scan-ring-outer" />
                <div className="scan-ring-mid" />
                <div className="scan-core">SCAN</div>
              </div>
              <div className="loading-title">Agentic Pipeline Active</div>
              <div className="loading-sub">4-agent chain running…</div>
              <div className="loading-steps">
                {[
                  'Agent 1 — Mission Planner crafting strategy…',
                  'Groq llama-4-scout — Vision analysis…',
                  'Agent 2 — Climate Analyst enriching telemetry…',
                  'Agent 3 — Report Synthesizer assembling output…',
                ].map((s, i) => (
                  <div className="loading-step" key={i}>
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">{s}</div>
                  </div>
                ))}
              </div>
              {mapMeta && (
                <p style={{ marginTop: 20, fontSize: 11, color: '#2a5070' }}>
                  Analyzing: {mapMeta.lat}, {mapMeta.lng} · {mapMeta.layer} layer · zoom {mapMeta.zoom}
                </p>
              )}
            </div>
          )}

          {report && !isAnalyzing && (
            <div className="report-wrap">

              {report.cached && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="cache-badge">⚡ Cached result</span>
                </div>
              )}

              {mapMeta && (
                <div className="location-bar">
                  <div className="location-dot" />
                  <span className="location-text">Analysis for live map capture · {mapMeta.layer} layer{mapMeta.weatherOverlay && mapMeta.weatherOverlay !== 'None' ? ` + ${mapMeta.weatherOverlay}` : ''}</span>
                  <span className="location-coords">{mapMeta.lat}°, {mapMeta.lng}°</span>
                </div>
              )}

              <div className="metric-grid">
                <div className="metric-card glass teal">
                  <div className="metric-tag">Classification Vector</div>
                  <div className="metric-val teal">{report.metrics.classification}</div>
                  <div className="metric-sub">Confidence: {report.metrics.confidence}</div>
                </div>
                <div className="metric-card glass blue">
                  <div className="metric-tag">Vegetation Index</div>
                  <div className="metric-val blue" style={{ fontSize: 14 }}>{report.metrics.vegetationIndex}</div>
                  <div className="metric-sub">Carbon: {report.metrics.estimatedCarbonLoss}</div>
                </div>
              </div>

              <div className="risk-row">
                <div className="risk-card glass amber">
                  <div className="risk-label">Risk Score</div>
                  <div className="risk-val amber">{report.metrics.riskScore}<span style={{ fontSize: 12, color: '#78624a' }}>/100</span></div>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{ width: `${report.metrics.riskScore}%`, background: riskColor(report.metrics.riskScore) }} />
                  </div>
                </div>
                <div className="risk-card glass red">
                  <div className="risk-label">Alert Level</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`alert-badge alert-${report.metrics.alertLevel}`}>
                      ● {report.metrics.alertLevel}
                    </span>
                  </div>
                  <div className="risk-sub" style={{ marginTop: 10 }}>Ecosystem threat tier</div>
                </div>
                <div className="risk-card glass purple">
                  <div className="risk-label">Detected Biome</div>
                  <div className="risk-val purple" style={{ fontSize: 13, marginTop: 6 }}>{report.llmAnalysis?.likelyBiome || '—'}</div>
                  <div className="risk-sub" style={{ marginTop: 6 }}>Agent 1 prediction</div>
                </div>
              </div>

              {(report.weatherPrediction || report.liveWeather) && (
                <div className="weather-card glass">
                  <div className="weather-header">
                    <div className="weather-header-icon">🌤</div>
                    <div style={{ flex: 1 }}>
                      <div className="weather-header-title">
                        Weather Data
                        {report.liveWeather
                          ? <span style={{ marginLeft: 8, fontSize: 9, padding: '2px 7px', borderRadius: 100, background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)', color: '#2dd4bf', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em' }}>● LIVE</span>
                          : <span style={{ marginLeft: 8, fontSize: 9, padding: '2px 7px', borderRadius: 100, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em' }}>AI ESTIMATE</span>
                        }
                      </div>
                      <div className="weather-header-sub">{report.liveWeather ? 'OpenWeatherMap real-time API · model uses this as ground truth' : 'Inferred from satellite visual cues — no coordinates provided'}</div>
                    </div>
                  </div>
                  {(() => {
                    const lw = report.liveWeather;
                    const wp = report.weatherPrediction || {};
                    return (
                      <>
                        <div className="weather-grid">
                          <div className="weather-stat">
                            <div className="weather-stat-label">Condition</div>
                            <div className="weather-stat-val">{lw ? lw.condition : wp.condition || '—'}</div>
                          </div>
                          <div className="weather-stat">
                            <div className="weather-stat-label">Temperature</div>
                            <div className="weather-stat-val">{lw ? `${lw.temperatureC}°C (feels ${lw.feelsLikeC}°C)` : wp.temperatureRange || '—'}</div>
                          </div>
                          <div className="weather-stat">
                            <div className="weather-stat-label">Humidity</div>
                            <div className="weather-stat-val">{lw ? `${lw.humidity}%` : wp.humidity || '—'}</div>
                          </div>
                          <div className="weather-stat">
                            <div className="weather-stat-label">{lw ? 'Rain (last 1h)' : 'Precipitation'}</div>
                            <div className="weather-stat-val">{lw ? `${lw.rainMmLastHour} mm` : wp.precipitationLikelihood || '—'}</div>
                          </div>
                          <div className="weather-stat">
                            <div className="weather-stat-label">Wind</div>
                            <div className="weather-stat-val">{lw ? `${lw.windSpeedMs} m/s` : wp.windIndicator || '—'}</div>
                          </div>
                          <div className="weather-stat">
                            <div className="weather-stat-label">{lw ? 'Cloud Cover' : 'Visibility'}</div>
                            <div className="weather-stat-val">{lw ? `${lw.cloudCoverPct}%` : wp.visibility || '—'}</div>
                          </div>
                        </div>
                        {wp.weatherSummary && (
                          <div className="weather-summary-section">
                            <p className="weather-summary-text">{wp.weatherSummary}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="ai-card glass">
                <div className="ai-header">
                  <div className="ai-header-icon"><AIIcon /></div>
                  <div>
                    <div className="ai-header-title">AI Synthesized Climate Breakdown</div>
                    <div className="ai-header-sub">4-agent chain · Groq llama-4-scout + llama-3.3-70b</div>
                  </div>
                </div>

                <div className="ai-section">
                  <div className="ai-section-label">Executive Summary</div>
                  <p className="ai-section-text">{report.llmAnalysis.summary}</p>
                </div>

                <div className="ai-section">
                  <div className="ai-section-label">Climate Impact Analysis</div>
                  <p className="ai-section-text">{report.llmAnalysis.climateImpact}</p>
                </div>

                {report.llmAnalysis.analystNote && (
                  <div className="ai-section">
                    <div className="ai-section-label">Analyst Note</div>
                    <p className="ai-section-text" style={{ fontStyle: 'italic', color: '#5a8070' }}>{report.llmAnalysis.analystNote}</p>
                  </div>
                )}

                {report.llmAnalysis.anomalyFlags?.length > 0 && (
                  <div className="ai-section">
                    <div className="ai-section-label">Anomaly Flags</div>
                    <div className="flag-list">
                      {report.llmAnalysis.anomalyFlags.map((flag, i) => (
                        <div className="flag-item" key={i}>
                          <span className="flag-icon">⚠</span>
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ai-section">
                  <div className="ai-section-label">Mitigation Directives</div>
                  <div className="rec-list">
                    {report.llmAnalysis.recommendations.map((rec, i) => (
                      <div className="rec-item" key={i}>
                        <div className="rec-num">{String(i + 1).padStart(2, '0')}</div>
                        <div className="rec-text">{rec}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {report.pipeline && (
                <div className="pipeline-strip glass">
                  <div className="pipeline-agents">
                    {report.pipeline.agentsUsed.map((a, i) => (
                      <React.Fragment key={i}>
                        <span className="agent-chip">{a}</span>
                        {i < report.pipeline.agentsUsed.length - 1 && <span className="agent-arrow">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="pipeline-model">{report.pipeline.model}</span>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </>
  );
}