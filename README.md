# Workshop Connect: SanRadiance × JayathiSoft

A QR-code feedback and course registration website for workshops.

| Page | Who uses it | Address |
|---|---|---|
| **Student form** | Students scan the QR and fill this on their phone | `https://YOUR-USERNAME.github.io/REPO-NAME/` |
| **Projector QR** | Open on the laptop connected to the projector | `…/qr.html` |
| **Admin dashboard** | Your team, with email + password | `…/admin.html` |

**Cost:** free. Firebase's free plan allows 20,000 form submissions and 50,000 page loads per day, far more than 200 students. GitHub Pages hosting is free.

**Time to set up:** about 30 minutes, one time. You don't need to write any code.

---

## Step 1: Turn on the website (GitHub Pages), about 2 minutes

1. Open this repository on github.com.
2. Click **Settings** (top bar), then **Pages** (left menu).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
5. Wait 1–2 minutes and refresh. A box appears: *"Your site is live at https://…github.io/…/"*. **Copy that address**; this is your student page.

> The page will show "Setup not finished" until you complete Step 3. That's expected.

## Step 2: Create a free Firebase project, about 5 minutes

1. Go to **https://console.firebase.google.com** and sign in with a Google account (use an office Gmail you'll keep).
2. Click **Create a project** (or **Add project**).
3. Name it, e.g. `sanradiance-workshop`, and click **Continue**.
4. **Turn off** Google Analytics (not needed), then click **Create project**. Wait for it to finish and click **Continue**.

## Step 3: Connect the website to Firebase, about 5 minutes

1. On the project home page, click the **`</>`** (Web) icon under "Get started by adding Firebase to your app".
2. App nickname: `website`. **Don't** tick "Firebase Hosting". Click **Register app**.
3. You'll see code containing `const firebaseConfig = { apiKey: "…", authDomain: "…", … }`. Keep this page open.
4. In another tab, open this repository on GitHub, click the file **`config.js`**, then the **pencil icon ✏️** (Edit).
5. Copy each value from Firebase into the matching line, replacing the `PASTE_…_HERE` text. **Keep the quotes.** For example:
   ```js
   apiKey: "AIzaSyB...your value...",
   authDomain: "sanradiance-workshop.firebaseapp.com",
   projectId: "sanradiance-workshop",
   ```
6. Click **Commit changes…** and then **Commit changes** again.
7. Back in Firebase, click **Continue to console**.

> These values are safe to put on a public website. They only identify your project; the security rules in Step 5 decide who can read data.

## Step 4: Create the database, about 3 minutes

1. In Firebase's left menu, open **Build → Firestore Database**, then click **Create database**.
2. **Location:** choose **asia-south1 (Mumbai)**. *This can't be changed later.*
3. Choose **Start in production mode**, then click **Create**.

## Step 5: Set the security rules and admin list, about 5 minutes

This decides who can see student phone numbers.

1. In Firestore Database, open the **Rules** tab.
2. Delete everything in the box.
3. Open the file **`firestore.rules`** in this repository, copy **all** of it, and paste it into the Firebase box.
4. Find this part:
   ```
   'admin@example.com'
   ```
   Replace it with the email(s) of your staff who should open the admin dashboard, for example:
   ```
   'shashank@sanradiance.com', 'office@jayathisoft.com'
   ```
5. Click **Publish**.

> To add or remove a staff member later, edit this list again and click **Publish**.

## Step 6: Create staff logins, about 3 minutes

1. In Firebase's left menu, open **Build → Authentication**, then click **Get started**.
2. Under **Sign-in method**, click **Email/Password**, switch on the **first** toggle and click **Save**.
3. Open the **Users** tab, then click **Add user**. Enter a staff email (the same one you put in Step 5) and a password, then click **Add user**. Repeat for each staff member.
4. Open the **Settings** tab, then **Authorized domains**, then **Add domain**. Enter `YOUR-USERNAME.github.io` (your GitHub address without `https://` and without the part after `/`), then click **Add**.

## Step 7: Test everything, about 5 minutes

1. Open your **student page** on your phone, fill the form with your own details and submit.
2. On a laptop, open **`…/admin.html`** and sign in. Your test entry should be there.
3. In the admin dashboard, go to **Workshop & programs** and click **Load starting content**. You can now edit workshop details, fees and batch dates there.
4. Delete your test entry (Submissions → **Delete** → **Yes**).
5. Open **`…/qr.html`** and scan the QR with your phone. It should open the student page.

✅ **You're ready for the workshop.**

---

## On the workshop day

- On the projector laptop, open **`…/qr.html`** and press **F11** for full screen.
- Keep **`…/admin.html`** open on another device to watch submissions arrive live.
- After the event: **Submissions → Download Excel (CSV)** gives you the full list for follow-up. It opens in Excel or Google Sheets.

## Everyday tasks (all in the admin dashboard)

| I want to… | Where |
|---|---|
| See who's interested | Submissions → filter **Interested only** |
| Track follow-up calls | Submissions → **Follow-up** column (New / Called / Visited centre / Enrolled) and **Notes** |
| Call or WhatsApp a student | Submissions → **Call** / **WhatsApp** buttons under the phone number |
| Change fees, batch dates, syllabus | Workshop & programs → program → **Edit** |
| Change date, time, venue | Workshop & programs → Workshop details → **Save** |
| Add a student success story | Testimonials → **Add testimonial** |
| Change the course catalogue | Workshop & programs → **Course catalogue link** (paste a Google Drive link to your PDF) → **Save** |

**Success stories rule:** a story is only shown to students after you tick *"student gave written permission"*. If it shows a salary package, you must also tick *"I checked the offer letter"*. Until at least one story is visible, students simply don't see the Success stories tab.

**Photos for success stories:** paste a link to the photo (for example, from your website or Google Drive set to "Anyone with the link"). For videos, paste a YouTube link.

## Changing things that aren't in the dashboard

These are edited directly on GitHub (open the file, click ✏️, change, **Commit changes**). The website updates in 1–2 minutes.

| What | File |
|---|---|
| Course catalogue PDF (if you don't use the Drive link) | Replace `assets/course-catalogue.pdf` (open the `assets` folder, then **Add file → Upload files**, using the same file name) |
| Logos | `assets/sanradiance-logo.png`, `assets/jayathisoft-logo.png` |
| Next workshop (keep submissions separate) | In `config.js`, change `workshopId`, e.g. to `"hubli-2026-11-20"`. In the admin dashboard, "All workshops" still shows everything. |
| Qualification or "attending as" options | `js/defaults.js` |

## Privacy

Student details are stored in your Firebase project only. Only the emails in your security rules can read them. Use phone numbers only for following up about the workshop and programs, as students agreed on the form. Delete entries if a student asks.

## Something's wrong?

| Problem | Fix |
|---|---|
| Student page says "Setup not finished" | Step 3: check every value in `config.js` is pasted inside quotes, then wait 2 minutes and refresh |
| Admin says "not on the admin list" | Step 5: add that email to the rules and click **Publish** |
| Admin says "Email or password is incorrect" | Step 6: check the user exists, or use **Forgot password?** |
| Form says "couldn't submit" | Check internet; check Step 4 (database created) and Step 5 (rules published) |
| Changes on GitHub don't show | Wait 2 minutes, then refresh with Ctrl+Shift+R |

---

### For developers

Static site (HTML/CSS/vanilla JS modules), no build step. Firebase JS SDK v10 loaded from gstatic. Data lives in Firestore collections `submissions`, `programs`, `testimonials` and the doc `settings/workshop`. Access control is in `firestore.rules`: students may only *create* validated submissions; admins are an email allow-list.
