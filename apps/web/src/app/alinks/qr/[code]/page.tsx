'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Link2,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Palette,
  Loader2,
} from 'lucide-react';
import QRCode from 'qrcode';

export default function QRCodePage() {
  const params = useParams();
  const code = params.code as string;
  const t = useTranslations('alinks');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors.link');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkData, setLinkData] = useState<{
    shortUrl: string;
    originalUrl: string;
  } | null>(null);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchLinkData();
  }, [code]);

  useEffect(() => {
    if (linkData) {
      generateQR();
    }
  }, [linkData, fgColor, bgColor, transparentBg]);

  const fetchLinkData = async () => {
    try {
      const res = await fetch(`/api/alinks/by-code/${code}`);
      const data = await res.json();
      if (res.ok) {
        setLinkData({
          shortUrl: data.shortUrl,
          originalUrl: data.originalUrl,
        });
      }
    } catch (error) {
      console.error('Error fetching link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQR = async () => {
    if (!linkData) return;

    try {
      const dataUrl = await QRCode.toDataURL(linkData.shortUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: fgColor,
          light: transparentBg ? '#00000000' : bgColor,
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  const downloadPNG = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const downloadSVG = async () => {
    if (!linkData) return;

    const svgString = await QRCode.toString(linkData.shortUrl, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: {
        dark: fgColor,
        light: transparentBg ? '#00000000' : bgColor,
      },
    });

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${code}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (linkData?.shortUrl) {
      await navigator.clipboard.writeText(linkData.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{tErrors('notFound.title')}</p>
          <Link href="/alinks/dashboard" className="text-primary hover:underline">
            {t('qr.backToLinks')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/alinks/dashboard"
          className="flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('qr.title')}</h1>
          <p className="text-muted-foreground">{linkData.shortUrl}</p>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="bg-card rounded-2xl border p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* QR Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`p-4 rounded-xl ${transparentBg ? 'bg-checkered' : ''}`}
              style={{ backgroundColor: transparentBg ? undefined : bgColor }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-6">
            {/* Colors */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('qr.customize')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('qr.foreground')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 cursor-pointer p-1 bg-background"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 h-12 px-4 rounded-lg border border-input bg-background text-sm uppercase font-mono"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-muted-foreground">
                      {t('qr.background')}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-muted-foreground">{t('qr.transparent')}</span>
                      <button
                        type="button"
                        onClick={() => setTransparentBg(!transparentBg)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          transparentBg ? 'bg-blue-500' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            transparentBg ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                  <div className={`flex items-center gap-3 ${transparentBg ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      disabled={transparentBg}
                      className="w-12 h-12 rounded-lg border-2 cursor-pointer p-1 bg-background disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={transparentBg ? t('qr.transparent') : bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      disabled={transparentBg}
                      className="flex-1 h-12 px-4 rounded-lg border border-input bg-background text-sm uppercase font-mono disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-2">
              <button
                onClick={downloadPNG}
                className="w-full h-11 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('qr.downloadPNG')}
              </button>
              <button
                onClick={downloadSVG}
                className="w-full h-11 rounded-lg border border-input bg-background hover:bg-accent font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('qr.downloadSVG')}
              </button>
              <button
                onClick={copyToClipboard}
                className="w-full h-11 rounded-lg border border-input bg-background hover:bg-accent font-medium transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    {tCommon('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('copyLink')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
