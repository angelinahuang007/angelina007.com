'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowDown, FiArrowUpRight } from 'react-icons/fi';
import { useAppearance } from '@/components/layout/ThemeProvider';
import { RoomCanvas } from './RoomCanvas';
import type { RoomMode, RoomViewer } from './scene/viewer';
import styles from './Hero.module.css';

export function Hero() {
  const { appearance, mounted } = useAppearance();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [offerMotion, setOfferMotion] = useState(false);
  const [motionMessage, setMotionMessage] = useState('');
  const viewerRef = useRef<RoomViewer | null>(null);
  const motionEligible = useRef(false);
  const motionAttempted = useRef(false);
  const motionAllowed = useRef(false);
  const mode: RoomMode = appearance === 'dark' ? 'lab' : 'studio';

  useEffect(() => {
    motionEligible.current = window.isSecureContext
      && typeof window.DeviceOrientationEvent !== 'undefined'
      && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
    setOfferMotion(motionEligible.current);
  }, []);

  useEffect(() => {
    setReady(false);
    setError(false);
  }, [mode, retry]);

  useEffect(() => {
    if (!motionMessage) return;
    const timeout = window.setTimeout(() => setMotionMessage(''), 4_000);
    return () => window.clearTimeout(timeout);
  }, [motionMessage]);

  const onReady = useCallback((viewer: RoomViewer | null) => {
    viewerRef.current = viewer;
    setReady(Boolean(viewer));
    // Permission is remembered only in this page, so changing rooms needs no new prompt.
    if (viewer && motionAllowed.current) void viewer.enableMotion();
  }, []);
  const onError = useCallback(() => { setError(true); setReady(false); }, []);
  const onTap = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !motionEligible.current || motionAttempted.current) return;
    motionAttempted.current = true;
    setOfferMotion(false);
    // Call directly from the canvas click, before awaiting anything: Safari needs this gesture.
    void viewer.enableMotion().then(result => {
      if (result === 'enabled') {
        motionAllowed.current = true;
        const current = viewerRef.current;
        if (current && current !== viewer) void current.enableMotion();
      } else if (viewer === viewerRef.current) {
        setMotionMessage(result === 'denied'
          ? 'Tilt access wasn’t enabled. You can still drag to explore.'
          : 'Tilt is unavailable here. You can still drag to explore.');
      }
    });
  }, []);

  return (
    <section data-room-hero className={`${styles.hero} ${mode === 'lab' ? styles.night : styles.day}`} aria-label="Angelina’s interactive studio">
      <picture className={styles.preview}>
        <source media="(max-width: 699px)" srcSet={`/rooms/${mode}-preview-mobile.webp?v=20261019`} type="image/webp" />
        {/* Native picture selects the matching camera view before fetching the preview. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/rooms/${mode}-preview.webp?v=20261019`}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={styles.previewImage}
        />
      </picture>
      <div className={styles.canvasWrap} data-ready={ready}>
        {mounted && <RoomCanvas key={`${mode}-${retry}`} mode={mode} onReady={onReady} onError={onError} onTap={onTap} />}
      </div>
      {!ready && <div className={error ? styles.loading : 'sr-only'} role="status">
        {error && <span className={styles.loadingMark}>A.</span>}
        <p>{error ? 'The interactive room couldn’t open on this device.' : 'Opening the room…'}</p>
        {error && <><button onClick={() => setRetry(value => value + 1)}>Try again</button><a href="#services">Explore my work ↓</a></>}
      </div>}
      <div className={styles.bottom}>
        <div className={styles.identity}>
          <p className={styles.eyebrow}>COMPUTING × ART</p>
          <h1>Angelina Huang<span>.</span></h1>
          <p className={styles.subtitle}>3D design, simulation & creative technology.</p>
          <div className={styles.links}><Link href="/portfolio">Selected work <FiArrowUpRight /></Link><Link href="/contact">Let’s talk <FiArrowUpRight /></Link></div>
        </div>
      </div>
      <p id="room-interaction-help" className="sr-only">
        On a computer, click the room, then move the mouse to look around without holding a button.
        Click again or press Escape to stop. Moving outside the room or scrolling also stops mouse look.
        Focus the scene and use A / D to turn and W / S to look up or down.
        On a phone, swipe sideways to turn and swipe up to explore the website.
        On supported phones over HTTPS, tap the scene to allow tilt controls.
      </p>
      {ready && offerMotion && <p className={styles.motionHint}>Tap the room to enable tilt.</p>}
      {motionMessage && <p className={styles.motionHint} role="status">{motionMessage}</p>}
      <a href="#services" className={styles.scroll} aria-label="Explore services below"><FiArrowDown /></a>
    </section>
  );
}
