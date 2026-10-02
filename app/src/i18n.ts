// UI texts per app language. Option values sent to the server stay in Croatian;
// OPTION_LABELS only changes what the user sees.

export type Lang = 'hr' | 'bs' | 'sr' | 'de' | 'en';
export type ToolId = 'caption' | 'reply' | 'bio' | 'reel' | 'wish' | 'rate' | 'image';

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { id: 'bs', label: 'Bosanski', flag: '🇧🇦' },
  { id: 'sr', label: 'Srpski', flag: '🇷🇸' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

// Caption language option value that matches each app language.
export const CAPTION_LANG_VALUE: Record<Lang, string> = {
  hr: 'Hrvatski', bs: 'Bosanski', sr: 'Srpski', de: 'Deutsch', en: 'English',
};

export function detectLang(): Lang {
  let locale = '';
  try {
    locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  } catch {
    // no Intl: fall through to the default
  }
  const code = locale.slice(0, 2);
  if (code === 'hr' || code === 'bs' || code === 'sr' || code === 'de' || code === 'en') return code;
  if (code === 'sh' || code === 'me') return 'sr';
  return 'en';
}

type ToolText = { name: string; blurb: string; title: string; subtitle: string; inputLabel: string; placeholder: string; button: string };

type Strings = {
  today: string;
  navTools: string; navSaved: string; navPremium: string;
  homeTitle: string; homeSub: string;
  heroTitle: string; heroSub: string; badgeNew: string;
  back: string;
  photoChange: string; photoChoose: string; photoOptional: string;
  needPhoto: string; needText: string; genericError: string; noNetwork: string; signInFailed: string; notConfigured: string;
  copy: string; copied: string; save: string; saved: string; share: string; shareSave: string; remove: string;
  hashtags: string;
  imgSub: string; imgLeft: (n: number) => string; imgNoneLeft: string; imgPoolNote: string;
  imgInputLabel: string; imgPlaceholder: string; imgDraw: string; imgDrawing: string; imgMorePremium: string; imgNeedText: string;
  savedTitle: string; savedSub: string; savedEmpty: string;
  proPerks: string[]; monthly: string; yearly: string; cancelAnytime: string; perMonth: string; soon: string;
  proNote: (texts: number) => string;
  language: string;
  noDetails: string;
  tools: Record<ToolId, ToolText>;
  fields: Record<string, string>;
};

const hr: Strings = {
  today: 'danas',
  navTools: 'Alati', navSaved: 'Spremljeno', navPremium: 'Premium',
  homeTitle: 'Što radimo danas?', homeSub: 'Odaberi alat, AI napravi ostalo.',
  heroTitle: 'Slika iz opisa', heroSub: 'Opiši što želiš, AI nacrta. Anime, 3D, foto…', badgeNew: 'NOVO',
  back: '‹ Svi alati',
  photoChange: 'Promijeni fotku', photoChoose: 'Odaberi fotku', photoOptional: 'Dodaj fotku (nije obavezno)',
  needPhoto: 'Prvo odaberi fotku.', needText: 'Napiši nešto u polje iznad.', genericError: 'Nešto je pošlo po zlu. Probaj opet.',
  noNetwork: 'Nema interneta. Provjeri vezu pa probaj opet.', signInFailed: 'Prijava na server nije uspjela. Probaj za par minuta.', notConfigured: 'Server nije podešen.',
  copy: 'Kopiraj', copied: 'Kopirano ✓', save: 'Spremi', saved: 'Spremljeno ✓', share: 'Podijeli', shareSave: 'Podijeli / spremi u galeriju', remove: 'Obriši',
  hashtags: 'Hashtagovi',
  imgSub: 'Opiši sliku, AI je nacrta.', imgLeft: (n) => `Danas možeš još ${n}.`, imgNoneLeft: 'Za danas su slike potrošene.',
  imgPoolNote: 'Besplatnih slika ima ograničen broj svaki dan za sve korisnike, tko prvi, njegova. 😉',
  imgInputLabel: 'Što želiš na slici?', imgPlaceholder: 'npr. mačka sa sunčanim naočalama na skuteru u Splitu, zalazak sunca',
  imgDraw: 'Nacrtaj 🎨', imgDrawing: 'Crtam… (do 30 s)', imgMorePremium: 'Više slika uz Premium 👑', imgNeedText: 'Opiši što želiš na slici.',
  savedTitle: 'Spremljeno', savedSub: 'Tvoji najdraži tekstovi i slike.', savedEmpty: 'Još ništa. Kod svakog rezultata dodirni "Spremi" i pojavit će se ovdje.',
  proPerks: ['Neograničeno tekstova', '20 slika dnevno', 'Bez reklama', 'Novi alati prvi'],
  monthly: 'Mjesečno', yearly: 'Godišnje · −48%', cancelAnytime: 'otkaži kad želiš', perMonth: '2,08 € mjesečno', soon: 'Uskoro',
  proNote: (n) => `Premium stiže uskoro. Do tada imaš ${n} besplatnih tekstova i 1 sliku svaki dan, dok ima besplatnih mjesta za taj dan.`,
  language: 'Jezik',
  noDetails: 'nema dodatnih detalja',
  tools: {
    caption: { name: 'Opis objave', blurb: 'Opis i hashtagovi', title: 'Opis za tvoju objavu', subtitle: 'Opiši fotku ili video, AI složi opis i hashtagove.', inputLabel: 'Što je na objavi?', placeholder: 'npr. Ja i ekipa na plaži u Makarskoj, zalazak sunca', button: 'Napravi opis ✨' },
    reply: { name: 'Što da odgovorim?', blurb: 'Odgovori na poruke', title: 'Što da odgovorim?', subtitle: 'Zalijepi poruku koju si dobio/la i odaberi kako želiš zvučati.', inputLabel: 'Poruka koju si dobio/la', placeholder: 'npr. Hej, jesi za piće ovaj vikend? 🍹', button: 'Predloži odgovore 💬' },
    reel: { name: 'Ideja za video', blurb: 'TikTok i Reels scenarij', title: 'Ideja za TikTok ili Reels', subtitle: 'Reci o čemu želiš snimiti, dobiješ scenarij kadar po kadar.', inputLabel: 'O čemu je video?', placeholder: 'npr. moja jutarnja rutina prije faksa', button: 'Smisli video 🎬' },
    wish: { name: 'Čestitka', blurb: 'Rođendan, ljubav, prijatelji', title: 'Čestitka ili posveta', subtitle: 'Odaberi priliku i dodaj par detalja, dobiješ osobnu poruku.', inputLabel: 'Za koga je i neki detalj (nije obavezno)', placeholder: 'npr. Ivana, najbolja prijateljica, volimo karaoke i kavu', button: 'Napiši poruku 💌' },
    rate: { name: 'Ocijeni fotku', blurb: 'Savjeti prije objave', title: 'Ocijeni moju fotku', subtitle: 'AI pogleda fotku i kaže kako je poboljšati prije objave.', inputLabel: 'Nešto dodatno (nije obavezno)', placeholder: 'npr. ne znam koji filter staviti', button: 'Ocijeni ⭐' },
    bio: { name: 'Bio za profil', blurb: 'Instagram, TikTok, dating', title: 'Bio za profil', subtitle: 'Napiši par riječi o sebi, dobiješ bio za Instagram ili TikTok.', inputLabel: 'O tebi', placeholder: 'npr. studentica, Zagreb, volim kavu, techno i putovanja', button: 'Napravi bio 🪄' },
    image: { name: 'Slika', blurb: '', title: 'Slika iz opisa', subtitle: '', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Mreža', tone: 'Stil', language: 'Jezik', sender: 'Tko ti piše', length: 'Duljina', style: 'Stil', occasion: 'Prilika', purpose: 'Fotka je za', format: 'Format', for: 'Za', how: 'Kako želiš zvučati' },
};

const bs: Strings = {
  ...hr,
  homeTitle: 'Šta radimo danas?', homeSub: 'Odaberi alat, AI uradi ostalo.',
  photoChange: 'Promijeni fotografiju', photoChoose: 'Odaberi fotografiju', photoOptional: 'Dodaj fotografiju (nije obavezno)',
  needPhoto: 'Prvo odaberi fotografiju.', genericError: 'Nešto je pošlo po zlu. Pokušaj ponovo.',
  noNetwork: 'Nema interneta. Provjeri vezu pa pokušaj ponovo.', signInFailed: 'Prijava na server nije uspjela. Pokušaj za par minuta.',
  save: 'Sačuvaj', saved: 'Sačuvano ✓', shareSave: 'Podijeli / sačuvaj u galeriju',
  imgPoolNote: 'Besplatnih slika ima ograničen broj svaki dan za sve korisnike, ko prvi, njegova. 😉',
  imgInputLabel: 'Šta želiš na slici?', imgPlaceholder: 'npr. mačka sa sunčanim naočalama na skuteru u Mostaru, zalazak sunca',
  imgDrawing: 'Crtam… (do 30 s)', imgNeedText: 'Opiši šta želiš na slici.',
  savedTitle: 'Sačuvano', savedSub: 'Tvoji najdraži tekstovi i slike.', savedEmpty: 'Još ništa. Kod svakog rezultata dodirni "Sačuvaj" i pojavit će se ovdje.',
  navSaved: 'Sačuvano',
  monthly: 'Mjesečno', yearly: 'Godišnje · −48%', cancelAnytime: 'otkaži kad želiš', perMonth: '2,08 € mjesečno',
  proNote: (n) => `Premium stiže uskoro. Do tada imaš ${n} besplatnih tekstova i 1 sliku svaki dan, dok ima besplatnih mjesta za taj dan.`,
  tools: {
    ...hr.tools,
    caption: { ...hr.tools.caption, subtitle: 'Opiši fotografiju ili video, AI složi opis i hashtagove.', inputLabel: 'Šta je na objavi?', placeholder: 'npr. Ja i ekipa na Vrelu Bosne, zalazak sunca', button: 'Napravi opis ✨' },
    reply: { ...hr.tools.reply, name: 'Šta da odgovorim?', title: 'Šta da odgovorim?', placeholder: 'npr. Hej, jesi za piće ovaj vikend? 🍹' },
    reel: { ...hr.tools.reel, subtitle: 'Reci o čemu želiš snimati, dobiješ scenarij kadar po kadar.', inputLabel: 'O čemu je video?', placeholder: 'npr. moja jutarnja rutina prije fakulteta' },
    wish: { ...hr.tools.wish, placeholder: 'npr. Amra, najbolja drugarica, volimo kafu i karaoke' },
    rate: { ...hr.tools.rate, name: 'Ocijeni fotografiju', title: 'Ocijeni moju fotografiju', subtitle: 'AI pogleda fotografiju i kaže kako je poboljšati prije objave.' },
    bio: { ...hr.tools.bio, placeholder: 'npr. studentica, Sarajevo, volim kafu, muziku i putovanja' },
  },
  fields: { ...hr.fields, sender: 'Ko ti piše', purpose: 'Fotografija je za' },
};

const sr: Strings = {
  ...bs,
  homeTitle: 'Šta radimo danas?', homeSub: 'Izaberi alat, AI uradi ostalo.',
  heroSub: 'Opiši šta želiš, AI nacrta. Anime, 3D, foto…',
  back: '‹ Svi alati',
  photoChange: 'Promeni fotografiju', photoChoose: 'Izaberi fotografiju', photoOptional: 'Dodaj fotografiju (nije obavezno)',
  needPhoto: 'Prvo izaberi fotografiju.', genericError: 'Nešto nije u redu. Pokušaj ponovo.',
  noNetwork: 'Nema interneta. Proveri vezu pa pokušaj ponovo.', signInFailed: 'Prijava na server nije uspela. Pokušaj za par minuta.', notConfigured: 'Server nije podešen.',
  imgSub: 'Opiši sliku, AI je nacrta.', imgLeft: (n) => `Danas možeš još ${n}.`,
  imgPoolNote: 'Besplatnih slika ima ograničen broj svakog dana za sve korisnike, ko prvi, njegova. 😉',
  imgPlaceholder: 'npr. mačka sa sunčanim naočarima na skuteru u Beogradu, zalazak sunca',
  savedEmpty: 'Još ništa. Kod svakog rezultata dodirni "Sačuvaj" i pojaviće se ovde.',
  proPerks: ['Neograničeno tekstova', '20 slika dnevno', 'Bez reklama', 'Novi alati prvi'],
  monthly: 'Mesečno', yearly: 'Godišnje · −48%', cancelAnytime: 'otkaži kad želiš', perMonth: '2,08 € mesečno', soon: 'Uskoro',
  proNote: (n) => `Premium stiže uskoro. Do tada imaš ${n} besplatnih tekstova i 1 sliku svakog dana, dok ima besplatnih mesta za taj dan.`,
  noDetails: 'nema dodatnih detalja',
  tools: {
    caption: { name: 'Opis objave', blurb: 'Opis i hešteg', title: 'Opis za tvoju objavu', subtitle: 'Opiši fotografiju ili video, AI složi opis i heštegove.', inputLabel: 'Šta je na objavi?', placeholder: 'npr. Ja i ekipa na Adi, zalazak sunca', button: 'Napravi opis ✨' },
    reply: { name: 'Šta da odgovorim?', blurb: 'Odgovori na poruke', title: 'Šta da odgovorim?', subtitle: 'Nalepi poruku koju si dobio/la i izaberi kako želiš da zvučiš.', inputLabel: 'Poruka koju si dobio/la', placeholder: 'npr. Ćao, jesi za piće ovog vikenda? 🍹', button: 'Predloži odgovore 💬' },
    reel: { name: 'Ideja za video', blurb: 'TikTok i Reels scenario', title: 'Ideja za TikTok ili Reels', subtitle: 'Reci o čemu želiš da snimaš, dobiješ scenario kadar po kadar.', inputLabel: 'O čemu je video?', placeholder: 'npr. moja jutarnja rutina pre faksa', button: 'Smisli video 🎬' },
    wish: { name: 'Čestitka', blurb: 'Rođendan, ljubav, prijatelji', title: 'Čestitka ili posveta', subtitle: 'Izaberi priliku i dodaj par detalja, dobiješ ličnu poruku.', inputLabel: 'Za koga je i neki detalj (nije obavezno)', placeholder: 'npr. Jelena, najbolja drugarica, volimo karaoke i kafu', button: 'Napiši poruku 💌' },
    rate: { name: 'Oceni fotografiju', blurb: 'Saveti pre objave', title: 'Oceni moju fotografiju', subtitle: 'AI pogleda fotografiju i kaže kako da je poboljšaš pre objave.', inputLabel: 'Nešto dodatno (nije obavezno)', placeholder: 'npr. ne znam koji filter da stavim', button: 'Oceni ⭐' },
    bio: { name: 'Bio za profil', blurb: 'Instagram, TikTok, dejting', title: 'Bio za profil', subtitle: 'Napiši par reči o sebi, dobiješ bio za Instagram ili TikTok.', inputLabel: 'O tebi', placeholder: 'npr. studentkinja, Novi Sad, volim kafu, muziku i putovanja', button: 'Napravi bio 🪄' },
    image: { name: 'Slika', blurb: '', title: 'Slika iz opisa', subtitle: '', inputLabel: '', placeholder: '', button: '' },
  },
  hashtags: 'Heštegovi',
  fields: { platform: 'Mreža', tone: 'Stil', language: 'Jezik', sender: 'Ko ti piše', length: 'Dužina', style: 'Stil', occasion: 'Prilika', purpose: 'Fotografija je za', format: 'Format', for: 'Za', how: 'Kako želiš da zvučiš' },
};

const de: Strings = {
  today: 'heute',
  navTools: 'Tools', navSaved: 'Gespeichert', navPremium: 'Premium',
  homeTitle: 'Was machen wir heute?', homeSub: 'Wähle ein Tool, die KI erledigt den Rest.',
  heroTitle: 'Bild aus Text', heroSub: 'Beschreib, was du willst, die KI malt es. Anime, 3D, Foto…', badgeNew: 'NEU',
  back: '‹ Alle Tools',
  photoChange: 'Foto ändern', photoChoose: 'Foto auswählen', photoOptional: 'Foto hinzufügen (optional)',
  needPhoto: 'Wähle zuerst ein Foto aus.', needText: 'Schreib etwas in das Feld oben.', genericError: 'Etwas ist schiefgelaufen. Versuch es noch einmal.',
  noNetwork: 'Kein Internet. Prüf deine Verbindung und versuch es erneut.', signInFailed: 'Anmeldung am Server fehlgeschlagen. Versuch es in ein paar Minuten.', notConfigured: 'Server ist nicht eingerichtet.',
  copy: 'Kopieren', copied: 'Kopiert ✓', save: 'Speichern', saved: 'Gespeichert ✓', share: 'Teilen', shareSave: 'Teilen / in Galerie speichern', remove: 'Löschen',
  hashtags: 'Hashtags',
  imgSub: 'Beschreib ein Bild, die KI malt es.', imgLeft: (n) => `Heute noch ${n} möglich.`, imgNoneLeft: 'Deine Bilder für heute sind aufgebraucht.',
  imgPoolNote: 'Kostenlose Bilder gibt es jeden Tag nur begrenzt für alle. Wer zuerst kommt… 😉',
  imgInputLabel: 'Was soll auf dem Bild sein?', imgPlaceholder: 'z. B. eine Katze mit Sonnenbrille auf einem Roller in Berlin, Sonnenuntergang',
  imgDraw: 'Malen 🎨', imgDrawing: 'Ich male… (bis 30 s)', imgMorePremium: 'Mehr Bilder mit Premium 👑', imgNeedText: 'Beschreib, was auf dem Bild sein soll.',
  savedTitle: 'Gespeichert', savedSub: 'Deine Lieblingstexte und -bilder.', savedEmpty: 'Noch nichts. Tippe bei einem Ergebnis auf "Speichern", dann erscheint es hier.',
  proPerks: ['Unbegrenzt Texte', '20 Bilder pro Tag', 'Keine Werbung', 'Neue Tools zuerst'],
  monthly: 'Monatlich', yearly: 'Jährlich · −48%', cancelAnytime: 'jederzeit kündbar', perMonth: '2,08 € pro Monat', soon: 'Bald verfügbar',
  proNote: (n) => `Premium kommt bald. Bis dahin hast du jeden Tag ${n} kostenlose Texte und 1 Bild, solange das Tageskontingent reicht.`,
  language: 'Sprache',
  noDetails: 'keine weiteren Details',
  tools: {
    caption: { name: 'Post-Text', blurb: 'Caption und Hashtags', title: 'Text für deinen Post', subtitle: 'Beschreib dein Foto oder Video, die KI schreibt Caption und Hashtags.', inputLabel: 'Was ist auf dem Post?', placeholder: 'z. B. Ich und meine Freunde am Strand, Sonnenuntergang', button: 'Text erstellen ✨' },
    reply: { name: 'Was soll ich antworten?', blurb: 'Antworten auf Nachrichten', title: 'Was soll ich antworten?', subtitle: 'Füg die Nachricht ein und wähl, wie du klingen willst.', inputLabel: 'Nachricht, die du bekommen hast', placeholder: 'z. B. Hey, Lust auf einen Drink am Wochenende? 🍹', button: 'Antworten vorschlagen 💬' },
    reel: { name: 'Video-Idee', blurb: 'TikTok- und Reels-Skript', title: 'Idee für TikTok oder Reels', subtitle: 'Sag, worüber du filmen willst, und bekomm ein Skript Szene für Szene.', inputLabel: 'Worum geht es im Video?', placeholder: 'z. B. meine Morgenroutine vor der Uni', button: 'Video ausdenken 🎬' },
    wish: { name: 'Glückwunsch', blurb: 'Geburtstag, Liebe, Freunde', title: 'Glückwunsch oder Widmung', subtitle: 'Wähl einen Anlass und ein paar Details, du bekommst eine persönliche Nachricht.', inputLabel: 'Für wen, und ein Detail (optional)', placeholder: 'z. B. Lena, beste Freundin, wir lieben Karaoke und Kaffee', button: 'Nachricht schreiben 💌' },
    rate: { name: 'Foto bewerten', blurb: 'Tipps vor dem Posten', title: 'Bewerte mein Foto', subtitle: 'Die KI schaut sich dein Foto an und sagt, wie du es vor dem Posten verbesserst.', inputLabel: 'Noch etwas dazu (optional)', placeholder: 'z. B. ich weiß nicht, welchen Filter ich nehmen soll', button: 'Bewerten ⭐' },
    bio: { name: 'Profil-Bio', blurb: 'Instagram, TikTok, Dating', title: 'Bio für dein Profil', subtitle: 'Schreib ein paar Worte über dich und bekomm eine Bio für Instagram oder TikTok.', inputLabel: 'Über dich', placeholder: 'z. B. Studentin, Stuttgart, liebe Kaffee, Techno und Reisen', button: 'Bio erstellen 🪄' },
    image: { name: 'Bild', blurb: '', title: 'Bild aus Text', subtitle: '', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Netzwerk', tone: 'Stil', language: 'Sprache', sender: 'Wer schreibt dir', length: 'Länge', style: 'Stil', occasion: 'Anlass', purpose: 'Das Foto ist für', format: 'Format', for: 'Für', how: 'Wie willst du klingen' },
};

const en: Strings = {
  today: 'today',
  navTools: 'Tools', navSaved: 'Saved', navPremium: 'Premium',
  homeTitle: 'What are we making today?', homeSub: 'Pick a tool, the AI does the rest.',
  heroTitle: 'Image from text', heroSub: 'Describe what you want, the AI draws it. Anime, 3D, photo…', badgeNew: 'NEW',
  back: '‹ All tools',
  photoChange: 'Change photo', photoChoose: 'Choose a photo', photoOptional: 'Add a photo (optional)',
  needPhoto: 'Choose a photo first.', needText: 'Type something in the field above.', genericError: 'Something went wrong. Try again.',
  noNetwork: 'No internet. Check your connection and try again.', signInFailed: 'Could not sign in to the server. Try again in a few minutes.', notConfigured: 'Server is not set up.',
  copy: 'Copy', copied: 'Copied ✓', save: 'Save', saved: 'Saved ✓', share: 'Share', shareSave: 'Share / save to gallery', remove: 'Delete',
  hashtags: 'Hashtags',
  imgSub: 'Describe an image, the AI draws it.', imgLeft: (n) => `${n} left today.`, imgNoneLeft: "You've used today's images.",
  imgPoolNote: 'Free images are limited each day for everyone, first come, first served. 😉',
  imgInputLabel: 'What should be in the image?', imgPlaceholder: 'e.g. a cat in sunglasses riding a scooter in Split at sunset',
  imgDraw: 'Draw 🎨', imgDrawing: 'Drawing… (up to 30 s)', imgMorePremium: 'More images with Premium 👑', imgNeedText: 'Describe what should be in the image.',
  savedTitle: 'Saved', savedSub: 'Your favourite texts and images.', savedEmpty: 'Nothing yet. Tap "Save" on any result and it shows up here.',
  proPerks: ['Unlimited texts', '20 images a day', 'No ads', 'New tools first'],
  monthly: 'Monthly', yearly: 'Yearly · −48%', cancelAnytime: 'cancel anytime', perMonth: '€2.08 a month', soon: 'Coming soon',
  proNote: (n) => `Premium is coming soon. Until then you get ${n} free texts and 1 image every day, while the daily free pool lasts.`,
  language: 'Language',
  noDetails: 'no extra details',
  tools: {
    caption: { name: 'Post caption', blurb: 'Caption and hashtags', title: 'Caption for your post', subtitle: 'Describe your photo or video, the AI writes a caption and hashtags.', inputLabel: "What's in the post?", placeholder: 'e.g. Me and my friends on the beach at sunset', button: 'Write caption ✨' },
    reply: { name: 'What do I reply?', blurb: 'Replies to messages', title: 'What do I reply?', subtitle: 'Paste the message you got and pick how you want to sound.', inputLabel: 'The message you got', placeholder: 'e.g. Hey, up for drinks this weekend? 🍹', button: 'Suggest replies 💬' },
    reel: { name: 'Video idea', blurb: 'TikTok and Reels script', title: 'TikTok or Reels idea', subtitle: 'Say what you want to film and get a shot-by-shot script.', inputLabel: "What's the video about?", placeholder: 'e.g. my morning routine before class', button: 'Get video idea 🎬' },
    wish: { name: 'Wishes', blurb: 'Birthday, love, friends', title: 'Wishes or a dedication', subtitle: 'Pick an occasion and add a few details to get a personal message.', inputLabel: "Who it's for, plus a detail (optional)", placeholder: 'e.g. Emma, best friend, we love karaoke and coffee', button: 'Write message 💌' },
    rate: { name: 'Rate my photo', blurb: 'Tips before posting', title: 'Rate my photo', subtitle: 'The AI looks at your photo and tells you how to improve it before posting.', inputLabel: 'Anything else (optional)', placeholder: "e.g. I can't pick a filter", button: 'Rate ⭐' },
    bio: { name: 'Profile bio', blurb: 'Instagram, TikTok, dating', title: 'Profile bio', subtitle: 'Write a few words about yourself and get a bio for Instagram or TikTok.', inputLabel: 'About you', placeholder: 'e.g. student, Munich, love coffee, techno and travel', button: 'Write bio 🪄' },
    image: { name: 'Image', blurb: '', title: 'Image from text', subtitle: '', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Network', tone: 'Style', language: 'Language', sender: 'Who sent it', length: 'Length', style: 'Style', occasion: 'Occasion', purpose: 'The photo is for', format: 'Format', for: 'For', how: 'How you want to sound' },
};

export const STRINGS: Record<Lang, Strings> = { hr, bs, sr, de, en };

// Display labels for option values (values themselves are the Croatian strings the server expects).
const OPT_DE: Record<string, string> = {
  'Opušteno': 'Locker', 'Duhovito': 'Witzig', 'Romantično': 'Romantisch', 'Motivacijski': 'Motivierend', 'Misteriozno': 'Mysteriös',
  'Simpatija': 'Schwarm', 'Prijatelj': 'Freund/in', 'Ekipa u grupi': 'Gruppenchat', 'Posao': 'Arbeit',
  'Flert': 'Flirty', 'Samouvjereno': 'Selbstbewusst', 'Pristojno odbij': 'Höflich absagen',
  'Cool': 'Cool', 'Minimal': 'Minimal', 'Ozbiljno': 'Seriös',
  'Edukativno': 'Lehrreich', 'Vlog': 'Vlog', 'Trend': 'Trend', 'Prije/poslije': 'Vorher/Nachher',
  'Rođendan': 'Geburtstag', 'Godišnjica veze': 'Jahrestag', 'Simpatiji': 'Für den Schwarm', 'Prijatelju': 'Für Freund/in', 'Mami ili tati': 'Für Mama oder Papa', 'Vjenčanje': 'Hochzeit', 'Novi posao': 'Neuer Job',
  'Emotivno': 'Emotional', 'Kratko i slatko': 'Kurz und süß', 'Pjesmica': 'Gedicht',
  'Instagram objava': 'Instagram-Post', 'Profilna slika': 'Profilbild', 'Dating profil': 'Dating-Profil', 'TikTok naslovna': 'TikTok-Cover',
  'Fotografija': 'Foto', 'Anime': 'Anime', 'Crtić': 'Cartoon', '3D': '3D', 'Akvarel': 'Aquarell', 'Neon': 'Neon',
  'Kvadrat': 'Quadrat', 'Uspravno': 'Hochformat', 'Vodoravno': 'Querformat',
  'Hrvatski': 'Kroatisch', 'Bosanski': 'Bosnisch', 'Srpski': 'Serbisch', 'Deutsch': 'Deutsch', 'English': 'Englisch',
};
const OPT_EN: Record<string, string> = {
  'Opušteno': 'Chill', 'Duhovito': 'Funny', 'Romantično': 'Romantic', 'Motivacijski': 'Motivational', 'Misteriozno': 'Mysterious',
  'Simpatija': 'Crush', 'Prijatelj': 'Friend', 'Ekipa u grupi': 'Group chat', 'Posao': 'Work',
  'Flert': 'Flirty', 'Samouvjereno': 'Confident', 'Pristojno odbij': 'Politely decline',
  'Cool': 'Cool', 'Minimal': 'Minimal', 'Ozbiljno': 'Serious',
  'Edukativno': 'Educational', 'Vlog': 'Vlog', 'Trend': 'Trend', 'Prije/poslije': 'Before/after',
  'Rođendan': 'Birthday', 'Godišnjica veze': 'Anniversary', 'Simpatiji': 'For a crush', 'Prijatelju': 'For a friend', 'Mami ili tati': 'For mom or dad', 'Vjenčanje': 'Wedding', 'Novi posao': 'New job',
  'Emotivno': 'Heartfelt', 'Kratko i slatko': 'Short and sweet', 'Pjesmica': 'Poem',
  'Instagram objava': 'Instagram post', 'Profilna slika': 'Profile picture', 'Dating profil': 'Dating profile', 'TikTok naslovna': 'TikTok cover',
  'Fotografija': 'Photo', 'Anime': 'Anime', 'Crtić': 'Cartoon', '3D': '3D', 'Akvarel': 'Watercolor', 'Neon': 'Neon',
  'Kvadrat': 'Square', 'Uspravno': 'Portrait', 'Vodoravno': 'Landscape',
  'Hrvatski': 'Croatian', 'Bosanski': 'Bosnian', 'Srpski': 'Serbian', 'Deutsch': 'German', 'English': 'English',
};
const OPT_BS: Record<string, string> = { 'Prijatelju': 'Prijatelju', 'Mami ili tati': 'Mami ili tati', 'Vjenčanje': 'Vjenčanje' };
const OPT_SR: Record<string, string> = {
  'Opušteno': 'Opušteno', 'Samouvjereno': 'Samouvereno', 'Pristojno odbij': 'Pristojno odbij', 'Prije/poslije': 'Pre/posle',
  'Godišnjica veze': 'Godišnjica veze', 'Vjenčanje': 'Venčanje', 'Pjesmica': 'Pesmica', 'Crtić': 'Crtani', 'Uspravno': 'Uspravno',
  'Fotografija': 'Fotografija', 'Profilna slika': 'Profilna slika',
};

export function optionLabel(lang: Lang, value: string): string {
  const map = lang === 'de' ? OPT_DE : lang === 'en' ? OPT_EN : lang === 'sr' ? OPT_SR : lang === 'bs' ? OPT_BS : {};
  return map[value] ?? value;
}
