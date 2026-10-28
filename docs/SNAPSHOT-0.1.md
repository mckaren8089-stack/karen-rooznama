# Snapshot 0.1 — انتشار، دامنه و هزینه‌ها

## وضعیت معماری انتشار
- `GitHub Pages` با انتخاب Source = **GitHub Actions**؛ انتشار از فایل `.github/workflows/deploy.yml` انجام می‌شود.
- دو کارت «Jekyll» و «Static HTML» در صفحه Pages **قالب‌های پیشنهادی ساخت Workflow** هستند، نه دو میزبان متفاوت یا الزام برای انتخاب. چون Workflow سفارشی داریم، هیچ‌کدام لازم نیست انتخاب شود.
- آدرس پیش‌فرض و رایگان پروژه پس از انتشار موفق: https://mckaren8089-stack.github.io/karen-rooznama/
- مخزن Public و استفاده از Runner استاندارد GitHub Actions و Pages برای این نسخه نیاز به خرید سرویس ندارد.

## Custom domain — تصمیم برای آینده
- می‌توان دامنه‌ای را که بعداً از هر ثبت‌کننده معتبر خریداری می‌کنیم به GitHub Pages متصل کرد.
- مثال دامنه اصلی: `example.com` و مثال زیردامنه: `rooznama.example.com`. این‌ها صرفاً مثال هستند و دامنه واقعی خریداری نشده.
- برای زیردامنه معمولاً رکورد DNS از نوع **CNAME** به `mckaren8089-stack.github.io` تنظیم می‌شود؛ دامنه اصلی از A/AAAA یا ALIAS/ANAME مطابق راهنمای به‌روز GitHub استفاده می‌کند.
- اضافه‌کردن نام دامنه به تنظیمات Pages و تأیید مالکیت آن توصیه می‌شود؛ سپس تنظیم DNS و بررسی HTTPS انجام می‌شود.
- GitHub Pages برای مخزن عمومی روی GitHub Free رایگان می‌ماند؛ تنها خرید/تمدید دامنه اختیاری هزینه خواهد داشت. گواهی HTTPS معمولاً از سوی GitHub برای تنظیم صحیح دامنه ارائه می‌شود.
- تصمیم فعلی: **دامنه اختصاصی خریداری نمی‌شود** و کادر Custom domain خالی می‌ماند.
- ریسک‌ها و جزئیات DNS زمان خرید دوباره مطابق مستندات رسمی GitHub بررسی شوند.

## موضوعات باز برای نسخه‌های بعد
- **مجوز نرم‌افزار** برای هر دو مخزن Rooznama و Karen Fuse باید به‌طور مستقل انتخاب شود: [LICENSING.md](LICENSING.md).
- مناسبت‌های فعلی آزمایشی‌اند؛ تا ورود و راستی‌آزمایی منبع رسمی دانشگاه تهران معتبر تلقی نشوند.
- بررسی واقعی رابط در Chrome اندروید، قابلیت نصب PWA و ذخیره یادداشت‌ها روی گوشی انجام شود.
- این نسخه پیش‌نمایش HTML/CSS/JS است؛ معماری بلندمدت React/TypeScript به تصمیم فنی بعدی موکول شده.

## منابع
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
