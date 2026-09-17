# 📱 টুকটুকির সংসার – Android APK Build Guide (GitHub Actions)

এই প্রজেক্টটি সরাসরি **GitHub Actions** এর মাধ্যমে স্বয়ংক্রিয়ভাবে Android APK (`.apk`) তৈরি করার জন্য প্রস্তুত করা হয়েছে।

---

## 🚀 গিটহাব থেকে সরাসরি APK তৈরি ও ডাউনলোড করার নিয়ম:

### ধাপ ১: গিটহাবে কোড পুশ করুন (Push to GitHub)
প্রজেক্টটি GitHub এ আপলোড (Push) করার সাথে সাথেই `.github/workflows/build-apk.yml` ওয়ার্কফ্লো স্বয়ংক্রিয়ভাবে চলতে শুরু করবে।

### ধাপ ২: Actions ট্যাবে যান
1. আপনার GitHub রিপোজিটরির **Actions** ট্যাবে ক্লিক করুন।
2. বাঁপাশের তালিকা থেকে **"Build Android APK"** নির্বাচন করুন।
3. আপনি চাইলে **"Run workflow"** বাটনে চাপ দিয়ে যেকোনো সময় ম্যানুয়ালি নতুন APK তৈরি করতে পারেন।

### ধাপ ৩: APK ডাউনলোড করুন (Download Artifact)
1. বিল্ড সম্পন্ন হলে (সবুজ টিকচিহ্ন দেখাবে, সাধারণত ২-৩ মিনিট সময় লাগে)।
2. বিল্ডের নামের ওপর ক্লিক করুন।
3. পেজের নিচের দিকে **Artifacts** সেকশনে **"Tuktukir-Sangsar-APK"** ফাইল দেখতে পাবেন।
4. সেটিতে ক্লিক করলেই সরাসরি **`tuktukir-sangsar-debug.apk`** আপনার কম্পিউটার বা ফোনে ডাউনলোড হয়ে যাবে!

---

## 💻 লোকাল মেশিনে APK বিল্ড করার কমান্ড (Optional):

যদি আপনি আপনার নিজস্ব কম্পিউটারে Android Studio বা টার্মিনাল দিয়ে সরাসরি APK তৈরি করতে চান:

```bash
# ১. ডিপেনডেন্সি ইনস্টল করুন
npm install

# ২. ওয়েব অ্যাপ বিল্ড ও ক্যাপাসিটর সিঙ্ক করুন
npm run cap:build

# ৩. সরাসরি APK ফাইল তৈরি করুন
npm run build:apk
```

তৈরিকৃত APK ফাইলটির লোকেশন:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🛠️ প্রযুক্তি ও কনফিগারেশন:
- **Framework:** React 19 + Vite 6 + Tailwind CSS
- **Mobile Engine:** Capacitor 8 (`@capacitor/core`, `@capacitor/android`)
- **App ID:** `com.tuktukirsangsar.app`
- **App Name:** টুকটুকির সংসার
- **GitHub Workflow:** `.github/workflows/build-apk.yml`
