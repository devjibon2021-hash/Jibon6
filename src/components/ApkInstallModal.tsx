import React, { useState } from 'react';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'bn' | 'en';
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
}) => {
  const [copied, setCopied] = useState(false);
  const [showDirectHelp, setShowDirectHelp] = useState(false);
  const sharedUrl = 'https://ais-pre-3canktu22lbz7qy3igjdyu-568031923881.europe-west2.run.app';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = () => {
    // Check if beforeinstallprompt prompt is available on window
    const deferredPrompt = (window as any).deferredInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        (window as any).deferredInstallPrompt = null;
      });
    } else {
      setShowDirectHelp(true);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="টুকটুকির সংসার App Icon"
              className="w-10 h-10 rounded-xl object-contain shadow-xs border border-slate-200 dark:border-slate-700 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {lang === 'bn' ? 'টুকটুকির সংসার – APK ও ইনস্টলেশন' : 'Tuktukir Sangsar – APK & Install'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'GitHub APK ও ফোনে ইনস্টল নির্দেশিকা' : 'GitHub APK & mobile install guide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* App Icon Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src="/icon-512.png"
                alt="টুকটুকির সংসার App Icon"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-contain shadow-md border-2 border-indigo-500/30 bg-white p-1"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-bold shadow-xs">
                HD 512px
              </span>
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'bn' ? 'অফিশিয়াল অ্যাপ আইকন (টুকটুকির সংসার)' : 'Official App Icon (Tuktukir Sangsar)'}
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'এই আইকনটিই আপনার ফোনের হোম স্ক্রিনে অ্যাপ লোগো হিসেবে প্রদর্শিত হবে।'
                  : 'This exact icon appears on your mobile home screen and app launcher.'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <a
                  href="/icon-512.png"
                  download="tuktukir-sangsar-icon-512.png"
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                >
                  <span>⬇️</span>
                  <span>{lang === 'bn' ? 'আইকন ডাউনলোড' : 'Download Icon'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        for (let registration of registrations) {
                          registration.update();
                        }
                      });
                    }
                    window.location.reload();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🔄</span>
                  <span>{lang === 'bn' ? 'ক্যাশ রিফ্রেশ করুন' : 'Refresh Cache'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <span>🔗</span>
                <span>{lang === 'bn' ? 'অ্যাপটির লাইভ শেয়ার লিংক (Shared App Link)' : 'Live Shared Link'}</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                ● Live & Ready
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-98'
                }`}
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
              </button>
            </div>

            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
              {lang === 'bn'
                ? 'এই লিংকটি আপনার বা পরিবারের যেকোনো ফোনে পাঠিয়ে ব্রাউজার দিয়ে অনায়াসে ব্যবহার করা যাবে।'
                : 'Send this link to any phone in your family to start recording expenses instantly.'}
            </p>
          </div>

          {/* Direct Install Button */}
          <div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>📲</span>
              <span>{lang === 'bn' ? 'ফোনে সরাসরি অ্যাপটি ইনস্টল করুন (WebAPK)' : 'Install App on Phone (WebAPK)'}</span>
            </button>

            {showDirectHelp && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 animate-fadeIn">
                <span className="text-base leading-none mt-0.5">💡</span>
                <p>
                  {lang === 'bn'
                    ? 'অ্যান্ড্রয়েড ফোনে অ্যাপটি সরাসরি হোম স্ক্রিনে ইনস্টল করতে ক্রোম ব্রাউজারের ৩টি ডটে (⋮) চেপে "Install app" অথবা "Add to Home screen" নির্বাচন করুন।'
                    : 'To install on your phone, open this link in Chrome, tap the 3 dots (⋮) and select "Install app" or "Add to Home screen".'}
                </p>
              </div>
            )}
          </div>

          {/* Step-by-Step Android APK Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span>🤖</span>
              <span>{lang === 'bn' ? 'অ্যান্ড্রয়েড ফোনে APK হিসেবে ইনস্টল করার নিয়ম:' : 'Android Installation Steps:'}</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  ১
                </span>
                <div>
                  <b className="text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? 'ক্রোম ব্রাউজারে লিংকটি খুলুন:' : 'Open in Google Chrome:'}
                  </b>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'অ্যান্ড্রয়েড ফোনের Google Chrome ব্রাউজারে উপরের শেয়ার লিংকটি পেস্ট করে প্রবেশ করুন।'
                      : 'Paste the shared link in Google Chrome on your Android device.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  ২
                </span>
                <div>
                  <b className="text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? 'মেনু বাটনে চাপ দিন (⋮):' : 'Tap Chrome Menu (⋮):'}
                  </b>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'ব্রাউজারের উপরের ডানদিকের ৩টি ডট (Three Dots) এ ক্লিক করুন।'
                      : 'Tap the three-dots menu icon at the top right of the browser.'}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                  ৩
                </span>
                <div>
                  <b className="text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? '"Install app" বা "Add to Home screen" নির্বাচন করুন:' : 'Select "Install app":'}
                  </b>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'মেনু থেকে "Install app" অথবা "হোম স্ক্রিনে যোগ করুন" চাপলে অ্যান্ড্রয়েড স্বয়ংক্রিয়ভাবে একটি অফিশিয়াল WebAPK তৈরি করে আপনার অ্যাপ ড্রয়ারে যুক্ত করে নেবে।'
                      : 'Chrome will automatically generate and install a standalone WebAPK right to your home screen!'}
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* GitHub Actions APK Builder Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <span>🐙</span>
                <span>{lang === 'bn' ? 'GitHub Actions দিয়ে APK তৈরি (অটোমেটেড)' : 'Automated GitHub Actions APK'}</span>
              </h5>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                CI/CD Ready
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'এই প্রজেক্টে GitHub Actions ওয়ার্কফ্লো (.github/workflows/build-apk.yml) ও Capacitor Android ইঞ্জিন সম্পূর্ণ যুক্ত করা হয়েছে।'
                : 'Capacitor Android native project & GitHub Actions workflow (.github/workflows/build-apk.yml) are fully configured.'}
            </p>
            <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px]">
                {lang === 'bn' ? '📌 গিটহাবে যেভাবে APK পাবেন:' : '📌 How to get your APK on GitHub:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>
                  {lang === 'bn'
                    ? 'কোড গিটহাবে পুশ করলে স্বয়ংক্রিয়ভাবে বিল্ড শুরু হবে।'
                    : 'Pushing code to GitHub triggers the build automatically.'}
                </li>
                <li>
                  {lang === 'bn'
                    ? 'GitHub এর Actions ট্যাব -> "Build Android APK" এ যান।'
                    : 'Go to GitHub Actions tab -> "Build Android APK".'}
                </li>
                <li>
                  {lang === 'bn'
                    ? 'বিল্ড সম্পন্ন হলে Artifacts থেকে "Tuktukir-Sangsar-APK" ডাউনলোড করুন।'
                    : 'Download "Tuktukir-Sangsar-APK" from Artifacts when complete.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Raw .APK Generation Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>📦</span>
              <span>{lang === 'bn' ? 'সরাসরি .apk ফাইল ডাউনলোড করতে চান?' : 'Want a standalone .apk installer file?'}</span>
            </h5>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'অ্যাপটি সম্পূর্ণ PWA স্ট্যান্ডার্ডে তৈরি। আপনি চাইলে PWABuilder (https://www.pwabuilder.com) এ এই শেয়ার লিংকটি দিলে ১ মিনিটে গুগল প্লে স্টোরের জন্য প্রস্তুত .apk ও .aab প্যাকেজ ডাউনলোড করে নিতে পারবেন।'
                : 'Since this is a standards-compliant PWA, you can also paste this URL into PWABuilder.com to download a pre-built Android .apk binary.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer transition-all"
          >
            {lang === 'bn' ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
