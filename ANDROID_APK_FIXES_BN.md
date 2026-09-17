# Android APK v1.1.0 – ঠিক করা হয়েছে

এই ভার্সনে:

- Android `CAMERA` runtime permission manifest-এ যোগ করা হয়েছে। Capacitor WebView-এর camera permission flow ব্যবহার করে ক্যামেরা চালু হবে।
- Android native Print plugin যোগ করা হয়েছে; Print বাটনে Android system print dialog খুলবে।
- PDF Export এখন browser-এর Save as PDF-এর ওপর নির্ভর না করে Android PDF তৈরি করে `Downloads/টুকটুকির সংসার/` ফোল্ডারে সংরক্ষণ করবে।
- App icon হিসেবে দেওয়া `1000182973.png` ব্যবহার করা হয়েছে এবং Android launcher-এর সব density icon আপডেট করা হয়েছে।
- Version Code 2 এবং Version Name 1.1.0 করা হয়েছে, যাতে পুরোনো APK-এর ওপর নতুন ভার্সন ইনস্টল করা যায়।
- GitHub Actions workflow Android SDK 36, Java 21 এবং Capacitor sync সহ আপডেট করা হয়েছে।

## GitHub-এ কী করবেন

1. এই ZIP-এর সব ফাইল GitHub repository-এর `main` branch-এ আপলোড/replace করুন।
2. `.github/workflows/build-apk.yml` ফাইলটি অবশ্যই থাকতে হবে।
3. GitHub → **Actions** → **Build Android APK v1.1.0** → **Run workflow** → `debug` নির্বাচন করুন।
4. Build শেষ হলে **Artifacts** থেকে `Tuktukir-Sangsar-APK-v1.1.0` ডাউনলোড করুন।
5. Debug APK ফোনে ইনস্টল করে Camera, Print এবং PDF পরীক্ষা করুন।
