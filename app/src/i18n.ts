// UI texts per app language. Option values sent to the server stay in Croatian;
// OPTION_LABELS only changes what the user sees.

export type Lang = 'hr' | 'bs' | 'sr' | 'de' | 'en';
export type ToolId = 'caption' | 'reply' | 'bio' | 'reel' | 'wish' | 'rate' | 'vibe' | 'story' | 'plan' | 'image' | 'edit' | 'fonts' | 'tags';

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
  proActive: string;
  language: string;
  noDetails: string;
  greeting: (hour: number) => string; streak: (days: number) => string;
  dailyTitle: string; dailyCaption: string; dailyTrend: string; dailyQuote: string; dailyChallenge: string; dailyLoading: string; dailyError: string;
  sectionTools: string; tryThis: string;
  editHeroTitle: string; editHeroSub: string; editSub: string; editPhoto: string; editInputLabel: string; editPlaceholder: string;
  editDo: string; editDoing: string; editNeedPhoto: string; editNeedText: string; editConsent: string;
  examples: Partial<Record<ToolId, string[]>>;
  sectionFree: string; inviteName: string; inviteBlurb: string; inviteMessage: (url: string) => string;
  fontsInputLabel: string; fontsPlaceholder: string; fontsTab: string; symbolsTab: string; tapToCopy: string;
  symbolGroups: Record<'hearts' | 'stars' | 'dividers' | 'kaomoji' | 'shapes', string>;
  tools: Record<ToolId, ToolText>;
  fields: Record<string, string>;
};

// 1 dan, 2 dana, 5 dana, 21 dan…
const danHr = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana');

const hr: Strings = {
  sectionFree: 'Besplatno, bez limita', inviteName: 'Pozovi prijatelja', inviteBlurb: 'Pošalji Vajb ekipi',
  inviteMessage: (u) => `Probaj Vajb AI ✨ AI pomoćnik za Instagram i TikTok: opisi, odgovori na poruke, slike i fontovi za bio. 👉 ${u}`,
  fontsInputLabel: 'Tvoj tekst', fontsPlaceholder: 'npr. tvoje ime ili rečenica za bio', fontsTab: 'Fontovi', symbolsTab: 'Simboli i kaomoji', tapToCopy: 'Dodirni za kopiranje',
  symbolGroups: { hearts: 'Srca', stars: 'Zvjezdice', dividers: 'Razdjelnici', kaomoji: 'Kaomoji', shapes: 'Strelice i oblici' },
  greeting: (h) => (h < 11 ? 'Dobro jutro ☀️' : h < 18 ? 'Bok! 👋' : 'Dobra večer 🌙'),
  streak: (n) => `🔥 ${n} ${danHr(n)}`,
  dailyTitle: 'Inspiracija dana', dailyCaption: 'Opis dana', dailyTrend: 'Video ideja dana', dailyQuote: 'Misao dana', dailyChallenge: 'Izazov dana',
  dailyLoading: 'Tražim inspiraciju…', dailyError: 'Inspiracija trenutno nije dostupna.',
  sectionTools: 'Svi alati', tryThis: 'Probaj:',
  editHeroTitle: 'Uredi svoju fotku', editHeroSub: 'Stavi se na plažu, u anime ili neon svijet.',
  editSub: 'Dodaj svoju fotku i reci što da AI promijeni. Troši 1 sliku.', editPhoto: 'Dodaj svoju fotku',
  editInputLabel: 'Što da promijenim?', editPlaceholder: 'npr. stavi me na plažu na Hvaru, zalazak sunca',
  editDo: 'Uredi fotku ✨', editDoing: 'Uređujem… (do 30 s)', editNeedPhoto: 'Prvo dodaj svoju fotku.', editNeedText: 'Napiši što da promijenim.',
  editConsent: 'Koristi samo svoje fotke ili fotke osoba koje su ti to dopustile.',
  examples: {
    caption: ['Kava s prijateljicom ☕', 'Prvi dan godišnjeg 🌊', 'Novi outfit za izlazak'],
    reply: ['Što radiš večeras? 😏', 'Oprosti što se nisam javio/la', 'Dolaziš u subotu na rođendan?'],
    reel: ['Što jedem u jednom danu', 'Moja jutarnja rutina', 'Uređujem sobu na budžetu'],
    wish: ['Mama, voli vrtlarenje i kavu', 'Najbolja prijateljica od vrtića'],
    bio: ['Studentica, volim putovanja i kavu', 'Teretana, glazba i dobra hrana'],
    story: ['Vikend na moru', 'Dan na poslu', 'Kuham večeru za ekipu'],
    plan: ['Zagreb, volimo hranu', 'Kišni dan', 'Prvi spoj'],
    image: ['Mačka u svemirskom odijelu na Mjesecu', 'Dubrovnik u zalazak sunca', 'Slatki zmaj pije kavu u kafiću'],
    edit: ['Stavi me na plažu na Hvaru', 'Pretvori me u anime lik', 'Stavi me u Pariz kraj Eiffelova tornja'],
  },
  proActive: 'Premium je aktivan. Uživaj u neograničenim tekstovima i 20 slika dnevno! 👑',
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
    vibe: { name: 'Vibe check', blurb: 'Koji je tvoj vibe?', title: 'Vibe check', subtitle: 'Dodaj fotku i AI ti kaže koji je tvoj vibe, boje i glazba koja ti paše.', inputLabel: 'Nešto dodatno (nije obavezno)', placeholder: 'npr. ovo je moja nova frizura', button: 'Provjeri vibe 🔮' },
    story: { name: 'Story ideje', blurb: 'Instagram storyji', title: 'Ideje za Instagram story', subtitle: 'Reci o čemu, dobiješ niz storyja s anketama i pitanjima.', inputLabel: 'O čemu su storyji?', placeholder: 'npr. vikend na moru s ekipom', button: 'Smisli storyje 📱' },
    plan: { name: 'Ideje za izlazak', blurb: 'Spoj, ekipa, vikend', title: 'Što da radimo?', subtitle: 'Odaberi s kim i budžet, dobiješ ideje za spoj ili izlazak.', inputLabel: 'Grad ili što volite (nije obavezno)', placeholder: 'npr. Zagreb, volimo hranu i glazbu', button: 'Daj ideje 🎉' },
    image: { name: 'Slika', blurb: '', title: 'Slika iz opisa', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    edit: { name: 'Uređena fotka', blurb: '', title: 'Uredi svoju fotku', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    fonts: { name: 'Fancy fontovi', blurb: 'Fontovi i simboli za bio', title: 'Fancy fontovi', subtitle: 'Upiši tekst i dodirni stil da ga kopiraš. Radi u Instagram i TikTok biju.', inputLabel: '', placeholder: '', button: '' },
    tags: { name: 'Gotovi hashtagovi', blurb: 'Po temama, jedan klik', title: 'Gotovi hashtagovi', subtitle: 'Odaberi temu i dodirni da kopiraš hashtagove.', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Mreža', tone: 'Stil', language: 'Jezik', sender: 'Tko ti piše', length: 'Duljina', style: 'Stil', occasion: 'Prilika', purpose: 'Fotka je za', format: 'Format', for: 'Za', how: 'Kako želiš zvučati', kind: 'Vrsta', who: 'S kim', budget: 'Budžet', place: 'Gdje' },
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
    vibe: { ...hr.tools.vibe, subtitle: 'Dodaj fotografiju i AI ti kaže koji je tvoj vibe, boje i muzika koja ti paše.', placeholder: 'npr. ovo je moja nova frizura' },
    plan: { ...hr.tools.plan, title: 'Šta da radimo?', inputLabel: 'Grad ili šta volite (nije obavezno)', placeholder: 'npr. Sarajevo, volimo hranu i muziku' },
    edit: { ...hr.tools.edit, name: 'Uređena fotografija', title: 'Uredi svoju fotografiju' },
  },
  fields: { ...hr.fields, sender: 'Ko ti piše', purpose: 'Fotografija je za' },
  greeting: (h) => (h < 11 ? 'Dobro jutro ☀️' : h < 18 ? 'Zdravo! 👋' : 'Dobro veče 🌙'),
  dailyLoading: 'Tražim inspiraciju…',
  editHeroTitle: 'Uredi svoju fotografiju',
  editSub: 'Dodaj svoju fotografiju i reci šta da AI promijeni. Troši 1 sliku.', editPhoto: 'Dodaj svoju fotografiju',
  editInputLabel: 'Šta da promijenim?', editPlaceholder: 'npr. stavi me na Stari most u Mostaru, zalazak sunca',
  editNeedPhoto: 'Prvo dodaj svoju fotografiju.', editNeedText: 'Napiši šta da promijenim.',
  editConsent: 'Koristi samo svoje fotografije ili fotografije osoba koje su ti to dozvolile.',
  examples: {
    ...hr.examples,
    caption: ['Kafa s prijateljicom ☕', 'Prvi dan godišnjeg 🌊', 'Novi outfit za izlazak'],
    reply: ['Šta radiš večeras? 😏', 'Izvini što se nisam javio/la', 'Dolaziš u subotu na rođendan?'],
    wish: ['Mama, voli baštu i kafu', 'Najbolja drugarica od vrtića'],
    bio: ['Studentica, volim putovanja i kafu', 'Teretana, muzika i dobra hrana'],
    plan: ['Sarajevo, volimo hranu', 'Kišni dan', 'Prvi spoj'],
    image: ['Mačka u svemirskom odijelu na Mjesecu', 'Stari most u Mostaru u zalazak sunca', 'Slatki zmaj pije kafu u kafiću'],
    edit: ['Stavi me na Vrelo Bosne', 'Pretvori me u anime lik', 'Stavi me u Pariz kod Eiffelovog tornja'],
  },
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
    vibe: { name: 'Vibe check', blurb: 'Koji je tvoj vibe?', title: 'Vibe check', subtitle: 'Dodaj fotografiju i AI ti kaže koji je tvoj vibe, boje i muzika koja ti paše.', inputLabel: 'Nešto dodatno (nije obavezno)', placeholder: 'npr. ovo je moja nova frizura', button: 'Proveri vibe 🔮' },
    story: { name: 'Story ideje', blurb: 'Instagram storiji', title: 'Ideje za Instagram story', subtitle: 'Reci o čemu, dobiješ niz storija sa anketama i pitanjima.', inputLabel: 'O čemu su storiji?', placeholder: 'npr. vikend na moru sa ekipom', button: 'Smisli storije 📱' },
    plan: { name: 'Ideje za izlazak', blurb: 'Sastanak, ekipa, vikend', title: 'Šta da radimo?', subtitle: 'Izaberi sa kim i budžet, dobiješ ideje za izlazak.', inputLabel: 'Grad ili šta volite (nije obavezno)', placeholder: 'npr. Beograd, volimo hranu i muziku', button: 'Daj ideje 🎉' },
    image: { name: 'Slika', blurb: '', title: 'Slika iz opisa', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    edit: { name: 'Uređena fotografija', blurb: '', title: 'Uredi svoju fotografiju', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    fonts: { name: 'Fancy fontovi', blurb: 'Fontovi i simboli za bio', title: 'Fancy fontovi', subtitle: 'Upiši tekst i dodirni stil da ga kopiraš. Radi u Instagram i TikTok biju.', inputLabel: '', placeholder: '', button: '' },
    tags: { name: 'Gotovi heštegovi', blurb: 'Po temama, jedan klik', title: 'Gotovi heštegovi', subtitle: 'Izaberi temu i dodirni da kopiraš heštegove.', inputLabel: '', placeholder: '', button: '' },
  },
  symbolGroups: { hearts: 'Srca', stars: 'Zvezdice', dividers: 'Razdelnici', kaomoji: 'Kaomoji', shapes: 'Strelice i oblici' },
  hashtags: 'Heštegovi',
  fields: { platform: 'Mreža', tone: 'Stil', language: 'Jezik', sender: 'Ko ti piše', length: 'Dužina', style: 'Stil', occasion: 'Prilika', purpose: 'Fotografija je za', format: 'Format', for: 'Za', how: 'Kako želiš da zvučiš', kind: 'Vrsta', who: 'Sa kim', budget: 'Budžet', place: 'Gde' },
  greeting: (h) => (h < 11 ? 'Dobro jutro ☀️' : h < 18 ? 'Ćao! 👋' : 'Dobro veče 🌙'),
  dailyTitle: 'Inspiracija dana', dailyTrend: 'Video ideja dana', dailyError: 'Inspiracija trenutno nije dostupna.',
  editHeroSub: 'Stavi se na plažu, u anime ili neon svet.',
  editSub: 'Dodaj svoju fotografiju i reci šta da AI promeni. Troši 1 sliku.',
  editInputLabel: 'Šta da promenim?', editPlaceholder: 'npr. stavi me na Kalemegdan, zalazak sunca',
  editNeedText: 'Napiši šta da promenim.',
  examples: {
    caption: ['Kafa sa drugaricom ☕', 'Prvi dan godišnjeg odmora 🌊', 'Novi autfit za izlazak'],
    reply: ['Šta radiš večeras? 😏', 'Izvini što se nisam javio/la', 'Dolaziš u subotu na rođendan?'],
    reel: ['Šta jedem u jednom danu', 'Moja jutarnja rutina', 'Sređujem sobu na budžetu'],
    wish: ['Mama, voli baštu i kafu', 'Najbolja drugarica iz vrtića'],
    bio: ['Studentkinja, volim putovanja i kafu', 'Teretana, muzika i dobra hrana'],
    story: ['Vikend na moru', 'Dan na poslu', 'Kuvam večeru za ekipu'],
    plan: ['Beograd, volimo hranu', 'Kišni dan', 'Prvi sastanak'],
    image: ['Mačka u svemirskom odelu na Mesecu', 'Kalemegdan u zalazak sunca', 'Slatki zmaj pije kafu u kafiću'],
    edit: ['Stavi me na plažu u Budvi', 'Pretvori me u anime lik', 'Stavi me u Pariz kod Ajfelove kule'],
  },
};

const de: Strings = {
  sectionFree: 'Gratis, ohne Limit', inviteName: 'Freunde einladen', inviteBlurb: 'Teil Vajb mit deinen Leuten',
  inviteMessage: (u) => `Probier Vajb AI ✨ KI-Helfer für Instagram und TikTok: Captions, Antworten, Bilder und Fonts für die Bio. 👉 ${u}`,
  fontsInputLabel: 'Dein Text', fontsPlaceholder: 'z. B. dein Name oder ein Satz für die Bio', fontsTab: 'Fonts', symbolsTab: 'Symbole & Kaomoji', tapToCopy: 'Zum Kopieren antippen',
  symbolGroups: { hearts: 'Herzen', stars: 'Sterne', dividers: 'Trenner', kaomoji: 'Kaomoji', shapes: 'Pfeile & Formen' },
  greeting: (h) => (h < 11 ? 'Guten Morgen ☀️' : h < 18 ? 'Hi! 👋' : 'Guten Abend 🌙'),
  streak: (n) => `🔥 ${n} ${n === 1 ? 'Tag' : 'Tage'}`,
  dailyTitle: 'Inspiration des Tages', dailyCaption: 'Caption des Tages', dailyTrend: 'Video-Idee des Tages', dailyQuote: 'Gedanke des Tages', dailyChallenge: 'Challenge des Tages',
  dailyLoading: 'Suche Inspiration…', dailyError: 'Die Inspiration ist gerade nicht verfügbar.',
  sectionTools: 'Alle Tools', tryThis: 'Probier:',
  editHeroTitle: 'Bearbeite dein Foto', editHeroSub: 'Ab an den Strand, in Anime oder Neon.',
  editSub: 'Füg dein Foto hinzu und sag der KI, was sie ändern soll. Kostet 1 Bild.', editPhoto: 'Dein Foto hinzufügen',
  editInputLabel: 'Was soll ich ändern?', editPlaceholder: 'z. B. setz mich an einen Strand bei Sonnenuntergang',
  editDo: 'Foto bearbeiten ✨', editDoing: 'Ich bearbeite… (bis 30 s)', editNeedPhoto: 'Füg zuerst dein Foto hinzu.', editNeedText: 'Schreib, was ich ändern soll.',
  editConsent: 'Nutze nur deine eigenen Fotos oder Fotos von Personen, die zugestimmt haben.',
  examples: {
    caption: ['Kaffee mit meiner besten Freundin ☕', 'Erster Urlaubstag 🌊', 'Neues Outfit für heute Abend'],
    reply: ['Was machst du heute Abend? 😏', 'Sorry, dass ich mich nicht gemeldet hab', 'Kommst du Samstag zum Geburtstag?'],
    reel: ['Was ich an einem Tag esse', 'Meine Morgenroutine', 'Zimmer-Makeover mit kleinem Budget'],
    wish: ['Mama, liebt Garten und Kaffee', 'Beste Freundin seit dem Kindergarten'],
    bio: ['Studentin, liebe Reisen und Kaffee', 'Gym, Musik und gutes Essen'],
    story: ['Wochenende am Meer', 'Ein Tag bei der Arbeit', 'Ich koche für meine Freunde'],
    plan: ['Stuttgart, wir lieben Essen', 'Regentag', 'Erstes Date'],
    image: ['Katze im Raumanzug auf dem Mond', 'Heidelberg bei Sonnenuntergang', 'Süßer Drache trinkt Kaffee im Café'],
    edit: ['Setz mich an einen Strand auf Mallorca', 'Mach mich zur Anime-Figur', 'Setz mich nach Paris vor den Eiffelturm'],
  },
  proActive: 'Premium ist aktiv. Viel Spaß mit unbegrenzten Texten und 20 Bildern pro Tag! 👑',
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
    vibe: { name: 'Vibe-Check', blurb: 'Was ist dein Vibe?', title: 'Vibe-Check', subtitle: 'Füg ein Foto hinzu und die KI sagt dir deinen Vibe, deine Farben und die passende Musik.', inputLabel: 'Noch etwas dazu (optional)', placeholder: 'z. B. das ist meine neue Frisur', button: 'Vibe checken 🔮' },
    story: { name: 'Story-Ideen', blurb: 'Instagram-Storys', title: 'Ideen für Instagram-Storys', subtitle: 'Sag worüber, und bekomm eine Story-Reihe mit Umfragen und Fragen.', inputLabel: 'Worum gehen die Storys?', placeholder: 'z. B. Wochenende am Meer mit Freunden', button: 'Storys ausdenken 📱' },
    plan: { name: 'Was unternehmen?', blurb: 'Date, Freunde, Wochenende', title: 'Was machen wir?', subtitle: 'Wähl mit wem und dein Budget, und bekomm Ideen fürs Date oder zum Ausgehen.', inputLabel: 'Stadt oder was ihr mögt (optional)', placeholder: 'z. B. Stuttgart, wir lieben Essen und Musik', button: 'Ideen bekommen 🎉' },
    image: { name: 'Bild', blurb: '', title: 'Bild aus Text', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    edit: { name: 'Bearbeitetes Foto', blurb: '', title: 'Bearbeite dein Foto', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    fonts: { name: 'Fancy Fonts', blurb: 'Fonts & Symbole für die Bio', title: 'Fancy Fonts', subtitle: 'Schreib deinen Text und tippe auf einen Stil, um ihn zu kopieren. Funktioniert in der Instagram- und TikTok-Bio.', inputLabel: '', placeholder: '', button: '' },
    tags: { name: 'Hashtag-Sets', blurb: 'Nach Thema, ein Klick', title: 'Hashtag-Sets', subtitle: 'Wähl ein Thema und tippe, um die Hashtags zu kopieren.', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Netzwerk', tone: 'Stil', language: 'Sprache', sender: 'Wer schreibt dir', length: 'Länge', style: 'Stil', occasion: 'Anlass', purpose: 'Das Foto ist für', format: 'Format', for: 'Für', how: 'Wie willst du klingen', kind: 'Art', who: 'Mit wem', budget: 'Budget', place: 'Wo' },
};

const en: Strings = {
  sectionFree: 'Free, no limits', inviteName: 'Invite a friend', inviteBlurb: 'Share Vajb with your people',
  inviteMessage: (u) => `Try Vajb AI ✨ an AI helper for Instagram and TikTok: captions, replies, images and fonts for your bio. 👉 ${u}`,
  fontsInputLabel: 'Your text', fontsPlaceholder: 'e.g. your name or a line for your bio', fontsTab: 'Fonts', symbolsTab: 'Symbols & kaomoji', tapToCopy: 'Tap to copy',
  symbolGroups: { hearts: 'Hearts', stars: 'Stars', dividers: 'Dividers', kaomoji: 'Kaomoji', shapes: 'Arrows & shapes' },
  greeting: (h) => (h < 11 ? 'Good morning ☀️' : h < 18 ? 'Hey! 👋' : 'Good evening 🌙'),
  streak: (n) => `🔥 ${n} ${n === 1 ? 'day' : 'days'}`,
  dailyTitle: 'Inspiration of the day', dailyCaption: 'Caption of the day', dailyTrend: 'Video idea of the day', dailyQuote: 'Thought of the day', dailyChallenge: 'Challenge of the day',
  dailyLoading: 'Finding inspiration…', dailyError: 'Inspiration is not available right now.',
  sectionTools: 'All tools', tryThis: 'Try:',
  editHeroTitle: 'Edit your photo', editHeroSub: 'Put yourself on a beach, in anime or neon.',
  editSub: 'Add your photo and tell the AI what to change. Uses 1 image.', editPhoto: 'Add your photo',
  editInputLabel: 'What should I change?', editPlaceholder: 'e.g. put me on a beach at sunset',
  editDo: 'Edit photo ✨', editDoing: 'Editing… (up to 30 s)', editNeedPhoto: 'Add your photo first.', editNeedText: 'Write what I should change.',
  editConsent: 'Only use your own photos or photos of people who said it is okay.',
  examples: {
    caption: ['Coffee with my best friend ☕', 'First day of holiday 🌊', 'New outfit for tonight'],
    reply: ['What are you up to tonight? 😏', "Sorry I didn't text back", 'Coming to the birthday on Saturday?'],
    reel: ['What I eat in a day', 'My morning routine', 'Room makeover on a budget'],
    wish: ['Mom, loves gardening and coffee', 'Best friend since kindergarten'],
    bio: ['Student, love travel and coffee', 'Gym, music and good food'],
    story: ['Weekend at the sea', 'A day at work', 'Cooking dinner for friends'],
    plan: ['Munich, we love food', 'Rainy day', 'First date'],
    image: ['A cat in a spacesuit on the Moon', 'Dubrovnik at sunset', 'A cute dragon drinking coffee in a café'],
    edit: ['Put me on a beach in Greece', 'Turn me into an anime character', 'Put me in Paris by the Eiffel Tower'],
  },
  proActive: 'Premium is active. Enjoy unlimited texts and 20 images a day! 👑',
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
    vibe: { name: 'Vibe check', blurb: "What's your vibe?", title: 'Vibe check', subtitle: 'Add a photo and the AI tells you your vibe, your colors and the music that fits you.', inputLabel: 'Anything else (optional)', placeholder: 'e.g. this is my new haircut', button: 'Check my vibe 🔮' },
    story: { name: 'Story ideas', blurb: 'Instagram stories', title: 'Instagram story ideas', subtitle: 'Say what about and get a story series with polls and questions.', inputLabel: 'What are the stories about?', placeholder: 'e.g. weekend at the sea with friends', button: 'Get story ideas 📱' },
    plan: { name: 'Going out ideas', blurb: 'Date, friends, weekend', title: 'What should we do?', subtitle: 'Pick who with and your budget, and get ideas for a date or a night out.', inputLabel: 'City or what you like (optional)', placeholder: 'e.g. Munich, we love food and music', button: 'Get ideas 🎉' },
    image: { name: 'Image', blurb: '', title: 'Image from text', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    edit: { name: 'Edited photo', blurb: '', title: 'Edit your photo', subtitle: '', inputLabel: '', placeholder: '', button: '' },
    fonts: { name: 'Fancy fonts', blurb: 'Fonts & symbols for your bio', title: 'Fancy fonts', subtitle: 'Type your text and tap a style to copy it. Works in your Instagram and TikTok bio.', inputLabel: '', placeholder: '', button: '' },
    tags: { name: 'Hashtag sets', blurb: 'By topic, one tap', title: 'Hashtag sets', subtitle: 'Pick a topic and tap to copy the hashtags.', inputLabel: '', placeholder: '', button: '' },
  },
  fields: { platform: 'Network', tone: 'Style', language: 'Language', sender: 'Who sent it', length: 'Length', style: 'Style', occasion: 'Occasion', purpose: 'The photo is for', format: 'Format', for: 'For', how: 'How you want to sound', kind: 'Type', who: 'Who with', budget: 'Budget', place: 'Where' },
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
  'Iskreno': 'Ehrlich', 'Anketa i pitanja': 'Umfragen & Fragen', 'Dan u životu': 'Ein Tag in meinem Leben', 'Iza kulisa': 'Hinter den Kulissen', 'Promocija': 'Werbung',
  'Spoj': 'Date', 'Ekipa': 'Freunde', 'Sam/a': 'Allein', 'Obitelj': 'Familie',
  'Besplatno': 'Kostenlos', 'Do 20 €': 'Bis 20 €', 'Bez limita': 'Ohne Limit', 'Vani': 'Draußen', 'Unutra': 'Drinnen', 'Realistično': 'Realistisch',
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
  'Iskreno': 'Honest', 'Anketa i pitanja': 'Polls & questions', 'Dan u životu': 'Day in my life', 'Iza kulisa': 'Behind the scenes', 'Promocija': 'Promo',
  'Spoj': 'Date', 'Ekipa': 'Friends', 'Sam/a': 'Solo', 'Obitelj': 'Family',
  'Besplatno': 'Free', 'Do 20 €': 'Up to €20', 'Bez limita': 'No limit', 'Vani': 'Outdoors', 'Unutra': 'Indoors', 'Realistično': 'Realistic',
};
const OPT_BS: Record<string, string> = { 'Prijatelju': 'Prijatelju', 'Mami ili tati': 'Mami ili tati', 'Vjenčanje': 'Vjenčanje', 'Obitelj': 'Porodica' };
const OPT_SR: Record<string, string> = {
  'Opušteno': 'Opušteno', 'Samouvjereno': 'Samouvereno', 'Pristojno odbij': 'Pristojno odbij', 'Prije/poslije': 'Pre/posle',
  'Godišnjica veze': 'Godišnjica veze', 'Vjenčanje': 'Venčanje', 'Pjesmica': 'Pesmica', 'Crtić': 'Crtani', 'Uspravno': 'Uspravno',
  'Fotografija': 'Fotografija', 'Profilna slika': 'Profilna slika',
  'Obitelj': 'Porodica', 'Spoj': 'Sastanak', 'Vani': 'Napolju', 'Unutra': 'Unutra', 'Iskreno': 'Iskreno',
};

export function optionLabel(lang: Lang, value: string): string {
  const map = lang === 'de' ? OPT_DE : lang === 'en' ? OPT_EN : lang === 'sr' ? OPT_SR : lang === 'bs' ? OPT_BS : {};
  return map[value] ?? value;
}
