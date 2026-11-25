<!-- 隱私權政策：內容照實際做法寫（收集什麼、送給誰、怎麼刪），改了資料流程要同步改這頁並更新日期 -->
<template>
  <article class="privacy">
    <p class="privacy__meta">{{ L(doc.updated) }}</p>
    <p>{{ L(doc.intro) }}</p>

    <section v-for="(sec, i) in doc.sections" :key="i">
      <h2 class="privacy__h2">{{ L(sec.title) }}</h2>
      <p v-if="sec.body">{{ L(sec.body) }}</p>
      <ul v-if="sec.items" class="privacy__list">
        <li v-for="(item, j) in sec.items" :key="j">{{ L(item) }}</li>
      </ul>
    </section>

    <h2 class="privacy__h2">{{ L(doc.contactTitle) }}</h2>
    <p>
      {{ L(doc.contactBody) }}
      <a :href="`mailto:${CONTACT}`" class="privacy__a">{{ CONTACT }}</a>
    </p>
  </article>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const L = (text) => text?.[locale.value] ?? text?.zh

const CONTACT = 'yubo0826@gmail.com'

// ponytail: 內容直接寫在這裡（同使用指南的 { zh, en } 寫法），只有這一頁用，不放進 lang.yaml
const doc = {
  updated: { zh: '最後更新：2026 年 11 月 25 日', en: 'Last updated: November 25, 2026' },
  intro: {
    zh: 'StockBar 是個人開發、維護的投資組合追蹤工具。這份說明列出我們收集哪些資料、怎麼使用、會經過哪些第三方服務，以及你如何刪除自己的資料。',
    en: 'StockBar is a portfolio tracker built and maintained by an individual developer. This page explains what data we collect, how it is used, which third-party services it passes through, and how you can delete it.',
  },
  sections: [
    {
      title: { zh: '我們收集的資料', en: 'What we collect' },
      items: [
        { zh: 'Google 帳號資料：用 Google 登入時取得的 email 與顯示名稱，存在我們的資料庫；大頭貼只在畫面上顯示，不另外儲存。', en: 'Google account data: the email address and display name from Google sign-in, stored in our database. Your profile photo is only displayed, not stored.' },
        { zh: '你自己輸入的資料：投資組合、交易、持股、配息、現金帳戶、換匯紀錄、目標配置、關注清單與通知設定。', en: 'Data you enter: portfolios, transactions, holdings, dividends, cash accounts, currency exchanges, target allocations, watchlist and notification settings.' },
        { zh: '瀏覽器本機儲存：登入狀態與偏好（語言、主題、顯示幣別等）存在你的瀏覽器，不會上傳。', en: 'Local browser storage: your sign-in state and preferences (language, theme, display currency, etc.) stay in your browser and are not uploaded.' },
      ],
    },
    {
      title: { zh: '我們不做的事', en: 'What we do not do' },
      items: [
        { zh: '不放廣告，不使用任何分析或追蹤工具，也沒有追蹤用的 cookie。', en: 'No ads, no analytics or tracking tools, and no tracking cookies.' },
        { zh: '不出售、出租或分享你的資料給任何人。', en: 'We never sell, rent or share your data with anyone.' },
      ],
    },
    {
      title: { zh: '資料用途', en: 'How we use it' },
      items: [
        { zh: '計算並顯示你的資產、報酬、配置與再平衡建議。', en: 'To calculate and show your assets, returns, allocation and rebalancing suggestions.' },
        { zh: '你開啟 Email 通知時，寄送投資組合偏離提醒到你的登入信箱。', en: 'To send portfolio drift alerts to your sign-in email when you turn email notifications on.' },
      ],
    },
    {
      title: { zh: '會經過的第三方服務', en: 'Third-party services' },
      items: [
        { zh: 'Google Firebase Authentication：處理 Google 登入。', en: 'Google Firebase Authentication: handles Google sign-in.' },
        { zh: 'Railway：網站前端、後端與資料庫的主機。', en: 'Railway: hosts the website, the backend and the database.' },
        { zh: 'Yahoo Finance、Tiingo：查詢報價與搜尋股票，只送出股票代號，不含任何帳號資料。', en: 'Yahoo Finance and Tiingo: quotes and symbol search. Only ticker symbols are sent, never account data.' },
        { zh: 'Email 寄送服務：只在寄送你開啟的通知時使用，會收到你的信箱與通知內容。', en: 'Email delivery service: used only to send notifications you turned on; it receives your email address and the message.' },
        { zh: '你的瀏覽器會直接向 Google Fonts、股票 logo 圖庫與匯率 API 載入字型、圖片和匯率。這些服務會看到你的 IP 位址，但不會收到帳號資料。', en: 'Your browser loads fonts, images and exchange rates directly from Google Fonts, stock-logo image hosts and an exchange-rate API. These services see your IP address but receive no account data.' },
      ],
    },
    {
      title: { zh: '保存與刪除', en: 'Retention and deletion' },
      items: [
        { zh: '帳號存在期間，資料會一直保存，讓你隨時查看。', en: 'Your data is kept for as long as your account exists.' },
        { zh: '在「使用者設定」輸入你的 email 即可刪除帳號。刪除會立即移除資料庫中你的所有資料與 Google 登入紀錄，無法復原。', en: 'You can delete your account in User settings by typing your email. This immediately removes all of your data from the database and your sign-in record, and cannot be undone.' },
        { zh: '資料庫備份（如有）會依主機商的備份週期自動覆蓋，不會再被還原到服務中。', en: 'Database backups, if any, are overwritten on the host’s backup cycle and are never restored into the service.' },
      ],
    },
    {
      title: { zh: '你的權利', en: 'Your rights' },
      body: {
        zh: '你可以隨時在網站上查看、修改自己的資料，或刪除帳號。若想查詢我們保存了哪些關於你的資料，或有其他請求，請來信聯絡。',
        en: 'You can view, edit or delete your data on the site at any time. To ask what data we hold about you, or for any other request, contact us by email.',
      },
    },
    {
      title: { zh: '政策更新', en: 'Changes' },
      body: {
        zh: '資料處理方式有變動時會更新這一頁，並修改上方的更新日期。',
        en: 'If the way we handle data changes, we will update this page and the date at the top.',
      },
    },
  ],
  contactTitle: { zh: '聯絡我們', en: 'Contact' },
  contactBody: { zh: '有任何隱私相關問題，請寄信到', en: 'For any privacy question, email' },
}
</script>

<style scoped>
.privacy {
  max-width: 46rem;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--p-text-color);
}

.privacy p {
  margin: 0 0 1rem;
}

.privacy__meta {
  font-size: 0.8125rem;
  color: var(--p-text-muted-color);
}

.privacy__h2 {
  margin: 2rem 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 500;
}

.privacy__list {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
  list-style: disc;
}

.privacy__list li + li {
  margin-top: 0.35rem;
}

.privacy__a {
  color: var(--p-primary-color);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
