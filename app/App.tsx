import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, editImage, generate, generateImage, getDaily, type Daily, type GenerateResult, type Mode } from './src/api';
import { FANCY_STYLES, SYMBOL_GROUPS } from './src/fancy';
import { HASHTAG_TOPICS, topicName, topicTags } from './src/hashtags';
import { CAPTION_LANG_VALUE, detectLang, LANGS, optionLabel, STRINGS, type Lang, type ToolId } from './src/i18n';
import { loadSaved, removeSaved, saveImage, saveText, writeImageFile, type SavedItem } from './src/saved';

const light = {
  bg: '#FFFFFF', card: '#F5F6FB', fg: '#161A2E', muted: '#5E6480', line: '#DDE0EC',
  accent: '#E3246E', accentFg: '#FFFFFF', sun: '#FFC83D', sunFg: '#2A2100', ok: '#138A5B',
};
const dark: typeof light = {
  bg: '#131629', card: '#1B1F36', fg: '#EEF0FA', muted: '#9AA0BD', line: '#2A2F4D',
  accent: '#FF4F8E', accentFg: '#1A0610', sun: '#FFD25E', sunFg: '#2A2100', ok: '#3DD39A',
};
type Colors = typeof light;

const FREE_TEXT_PER_DAY = 5;
const FREE_IMAGES_PER_DAY = 1;
const LANG_KEY = 'vajb-lang';
const STREAK_KEY = 'vajb-streak';
// Page that explains how to get the app; it can change without an app update.
const INVITE_URL = 'https://majastronger.github.io/Vajb-app/';

// Option values are the Croatian strings the server expects; labels come from i18n.
type Field = { key: string; label: string; options: string[] };
type TextTool = { id: Mode; icon: string; fields: Field[]; photo?: 'optional' | 'required'; isNew?: boolean };

const CAPTION_LANGS = ['Hrvatski', 'Bosanski', 'Srpski', 'Deutsch', 'English'];

const TEXT_TOOLS: TextTool[] = [
  {
    id: 'caption', icon: '📸', photo: 'optional',
    fields: [
      { key: 'platform', label: 'platform', options: ['Instagram', 'TikTok', 'Facebook'] },
      { key: 'tone', label: 'tone', options: ['Opušteno', 'Duhovito', 'Romantično', 'Motivacijski', 'Misteriozno'] },
      { key: 'language', label: 'language', options: CAPTION_LANGS },
    ],
  },
  {
    id: 'reply', icon: '💬',
    fields: [
      { key: 'sender', label: 'sender', options: ['Simpatija', 'Prijatelj', 'Ekipa u grupi', 'Posao'] },
      { key: 'tone', label: 'how', options: ['Duhovito', 'Opušteno', 'Flert', 'Samouvjereno', 'Pristojno odbij'] },
    ],
  },
  {
    id: 'vibe', icon: '🔮', photo: 'required', isNew: true,
    fields: [{ key: 'tone', label: 'tone', options: ['Iskreno', 'Duhovito'] }],
  },
  {
    id: 'reel', icon: '🎬',
    fields: [
      { key: 'platform', label: 'for', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
      { key: 'length', label: 'length', options: ['15 s', '30 s', '60 s'] },
      { key: 'style', label: 'style', options: ['Duhovito', 'Edukativno', 'Vlog', 'Trend', 'Prije/poslije'] },
    ],
  },
  {
    id: 'story', icon: '📱', isNew: true,
    fields: [
      { key: 'kind', label: 'kind', options: ['Anketa i pitanja', 'Dan u životu', 'Iza kulisa', 'Promocija'] },
      { key: 'tone', label: 'tone', options: ['Opušteno', 'Duhovito', 'Motivacijski'] },
    ],
  },
  {
    id: 'plan', icon: '🎉', isNew: true,
    fields: [
      { key: 'who', label: 'who', options: ['Spoj', 'Ekipa', 'Sam/a', 'Obitelj'] },
      { key: 'budget', label: 'budget', options: ['Besplatno', 'Do 20 €', 'Bez limita'] },
      { key: 'place', label: 'place', options: ['Vani', 'Unutra'] },
    ],
  },
  {
    id: 'wish', icon: '💌',
    fields: [
      { key: 'occasion', label: 'occasion', options: ['Rođendan', 'Godišnjica veze', 'Simpatiji', 'Prijatelju', 'Mami ili tati', 'Vjenčanje', 'Novi posao'] },
      { key: 'tone', label: 'tone', options: ['Emotivno', 'Duhovito', 'Kratko i slatko', 'Pjesmica'] },
    ],
  },
  {
    id: 'rate', icon: '⭐', photo: 'required',
    fields: [{ key: 'purpose', label: 'purpose', options: ['Instagram objava', 'Profilna slika', 'Dating profil', 'TikTok naslovna'] }],
  },
  {
    id: 'bio', icon: '👤',
    fields: [
      { key: 'platform', label: 'for', options: ['Instagram', 'TikTok', 'Tinder/Bumble', 'LinkedIn'] },
      { key: 'tone', label: 'tone', options: ['Cool', 'Duhovito', 'Minimal', 'Ozbiljno'] },
    ],
  },
];

const IMAGE_FIELDS: Field[] = [
  { key: 'style', label: 'style', options: ['Fotografija', 'Anime', 'Crtić', '3D', 'Akvarel', 'Neon'] },
  { key: 'format', label: 'format', options: ['Kvadrat', 'Uspravno', 'Vodoravno'] },
];

const EDIT_FIELDS: Field[] = [
  { key: 'style', label: 'style', options: ['Realistično', 'Anime', 'Crtić', '3D', 'Akvarel', 'Neon'] },
];

// Tools that work without any text (the server gets "no extra details").
const INPUT_OPTIONAL: Mode[] = ['wish', 'plan'];

// Soft background per tool tile, light and dark.
const TINTS = {
  light: ['#FFE4EF', '#E4EEFF', '#F0E6FF', '#FFF0D2', '#E0F6EC', '#FFE6DC', '#E2F4FF', '#FFE9F4', '#ECEEFF'],
  dark: ['#3A1C2B', '#1C2A44', '#2B2142', '#3A3019', '#173329', '#3A2420', '#18303D', '#3A1F30', '#23264A'],
};

function localDay(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Days in a row the app was opened.
async function bumpStreak(): Promise<number> {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  let prev: { day: string; count: number } | null = null;
  try {
    prev = JSON.parse((await AsyncStorage.getItem(STREAK_KEY)) ?? 'null');
  } catch {
    prev = null;
  }
  const count = prev?.day === localDay(today) ? prev.count : prev?.day === localDay(yesterday) ? prev.count + 1 : 1;
  AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ day: localDay(today), count })).catch(() => {});
  return count;
}

const LangContext = createContext<Lang>('hr');
const useLang = () => useContext(LangContext);
const useT = () => STRINGS[useLang()];

function defaults(fields: Field[], lang: Lang) {
  const out = Object.fromEntries(fields.map((f) => [f.key, f.options[0]]));
  if ('language' in out) out.language = CAPTION_LANG_VALUE[lang];
  return out;
}

// Server messages are already localized; local failures get a message in the app language.
function errorText(e: unknown, t: (typeof STRINGS)[Lang]) {
  if (!(e instanceof ApiError)) return t.genericError;
  if (e.message) return e.message;
  if (e.code === 'offline') return t.noNetwork;
  if (e.code === 'sign_in') return t.signInFailed;
  if (e.code === 'not_configured') return t.notConfigured;
  return t.genericError;
}

type Tab = 'home' | 'saved' | 'pro';

export default function App() {
  const c = useColorScheme() === 'dark' ? dark : light;
  const [lang, setLang] = useState<Lang>(detectLang);
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [tool, setTool] = useState<ToolId | null>(null);
  const [textLeft, setTextLeft] = useState<number | null>(FREE_TEXT_PER_DAY);
  const [imageLeft, setImageLeft] = useState<number | null>(FREE_IMAGES_PER_DAY);
  const [streak, setStreak] = useState(1);
  const t = STRINGS[lang];

  useEffect(() => {
    bumpStreak().then(setStreak);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => {
        if (v && LANGS.some((l) => l.id === v)) setLang(v as Lang);
      })
      .catch(() => {});
  }, []);

  const chooseLang = (l: Lang) => {
    setLang(l);
    setLangOpen(false);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (langOpen) {
        setLangOpen(false);
        return true;
      }
      if (tool) {
        setTool(null);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tool, tab, langOpen]);

  const goPremium = () => {
    setTool(null);
    setTab('pro');
  };

  let screen;
  if (tab === 'home' && tool === 'image') {
    screen = <ImageTool c={c} left={imageLeft} setLeft={setImageLeft} onBack={() => setTool(null)} onLimit={goPremium} />;
  } else if (tab === 'home' && tool === 'fonts') {
    screen = <Fonts c={c} onBack={() => setTool(null)} />;
  } else if (tab === 'home' && tool === 'tags') {
    screen = <Tags c={c} onBack={() => setTool(null)} />;
  } else if (tab === 'home' && tool === 'edit') {
    screen = <EditTool c={c} left={imageLeft} setLeft={setImageLeft} onBack={() => setTool(null)} onLimit={goPremium} />;
  } else if (tab === 'home' && tool) {
    const tt = TEXT_TOOLS.find((x) => x.id === tool)!;
    screen = <Generator key={`${tt.id}-${lang}`} tool={tt} c={c} onBack={() => setTool(null)} onRemaining={setTextLeft} onLimit={goPremium} />;
  } else if (tab === 'home') {
    screen = <Home c={c} dark={c === dark} streak={streak} onOpen={setTool} />;
  } else if (tab === 'saved') {
    screen = <Saved c={c} />;
  } else {
    screen = <Premium c={c} active={textLeft === null} />;
  }

  const current = LANGS.find((l) => l.id === lang)!;

  return (
    <LangContext.Provider value={lang}>
      <SafeAreaProvider>
        <SafeAreaView style={[s.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
          <StatusBar style="auto" />
          <View style={s.header}>
            <Text style={[s.logo, { color: c.fg }]}>
              vajb<Text style={{ color: c.accent }}>.</Text>ai
            </Text>
            <View style={s.headerRight}>
              <Pressable
                onPress={() => setLangOpen(!langOpen)}
                style={[s.langBtn, { borderColor: c.line, backgroundColor: c.card }]}
                accessibilityRole="button"
                accessibilityLabel={t.language}
              >
                <Text style={{ fontSize: 16 }}>{current.flag}</Text>
                <Text style={{ color: c.fg, fontWeight: '700', fontSize: 13 }}>{lang.toUpperCase()}</Text>
              </Pressable>
              <View style={[s.credits, textLeft === null ? { backgroundColor: c.sun } : { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
                <Text style={[s.creditsText, { color: textLeft === null ? c.sunFg : c.fg }]}>
                  {textLeft === null ? 'PREMIUM' : `${textLeft}/${FREE_TEXT_PER_DAY} ${t.today}`}
                </Text>
              </View>
            </View>
          </View>

          {langOpen && (
            <View style={[s.langMenu, { borderColor: c.line, backgroundColor: c.card }]}>
              {LANGS.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => chooseLang(l.id)}
                  style={[s.langItem, l.id === lang && { backgroundColor: c.bg }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: l.id === lang }}
                >
                  <Text style={{ fontSize: 18 }}>{l.flag}</Text>
                  <Text style={{ color: c.fg, fontWeight: l.id === lang ? '800' : '500', fontSize: 15 }}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ flex: 1 }}>{screen}</View>

          <View style={[s.nav, { borderTopColor: c.line }]}>
            {([
              ['home', '✨', t.navTools],
              ['saved', '🔖', t.navSaved],
              ['pro', '👑', t.navPremium],
            ] as const).map(([key, icon, label]) => (
              <Pressable
                key={key}
                style={s.navBtn}
                onPress={() => {
                  setTab(key);
                  setTool(null);
                  setLangOpen(false);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === key }}
              >
                <Text style={s.navIcon}>{icon}</Text>
                <Text style={[s.navLabel, { color: tab === key ? c.accent : c.muted }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </LangContext.Provider>
  );
}

function Home({ c, dark: isDark, streak, onOpen }: { c: Colors; dark: boolean; streak: number; onOpen: (id: ToolId) => void }) {
  const t = useT();
  const tints = isDark ? TINTS.dark : TINTS.light;
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View style={s.homeHead}>
        <View style={{ flex: 1 }}>
          <Text style={[s.greet, { color: c.muted }]}>{t.greeting(new Date().getHours())}</Text>
          <Text style={[s.h1, { color: c.fg }]}>{t.homeTitle}</Text>
        </View>
        <View style={[s.streak, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={{ color: c.fg, fontWeight: '800', fontSize: 13 }}>{t.streak(streak)}</Text>
        </View>
      </View>

      <Pressable onPress={() => onOpen('image')} style={({ pressed }) => [s.hero, { backgroundColor: c.fg }, pressed && s.pressed]}>
        <View style={[s.blob, { backgroundColor: c.accent, right: -30, top: -40 }]} />
        <View style={[s.blob, s.blobSmall, { backgroundColor: c.sun, right: -25, bottom: -50 }]} />
        <Text style={{ fontSize: 34 }}>🎨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroTitle, { color: c.bg }]}>{t.heroTitle}</Text>
          <Text style={{ color: c.bg, opacity: 0.85 }}>{t.heroSub}</Text>
        </View>
      </Pressable>

      <Pressable onPress={() => onOpen('edit')} style={({ pressed }) => [s.hero, { backgroundColor: c.accent }, pressed && s.pressed]}>
        <View style={[s.blob, { backgroundColor: c.sun, left: -50, bottom: -60, opacity: 0.35 }]} />
        <View style={[s.blob, s.blobSmall, { backgroundColor: '#FFFFFF', right: -20, top: -30, opacity: 0.2 }]} />
        <Text style={{ fontSize: 34 }}>🤳</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroTitle, { color: c.accentFg }]}>{t.editHeroTitle}</Text>
          <Text style={{ color: c.accentFg, opacity: 0.9 }}>{t.editHeroSub}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: c.sun }]}>
          <Text style={{ color: c.sunFg, fontWeight: '800', fontSize: 11 }}>{t.badgeNew}</Text>
        </View>
      </Pressable>

      <DailyCard c={c} />

      <Text style={[s.section, { color: c.fg }]}>{t.sectionTools}</Text>
      <View style={s.grid}>
        {TEXT_TOOLS.map((tool, i) => (
          <Pressable
            key={tool.id}
            onPress={() => onOpen(tool.id)}
            style={({ pressed }) => [s.tile, { backgroundColor: tints[i % tints.length] }, pressed && s.pressed]}
          >
            <View style={s.tileTop}>
              <View style={[s.tileIcon, { backgroundColor: c.bg }]}>
                <Text style={{ fontSize: 22 }}>{tool.icon}</Text>
              </View>
              {tool.isNew && (
                <View style={[s.badge, { backgroundColor: c.accent }]}>
                  <Text style={{ color: c.accentFg, fontWeight: '800', fontSize: 10 }}>{t.badgeNew}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tileName, { color: c.fg }]}>{t.tools[tool.id].name}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.tools[tool.id].blurb}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[s.section, { color: c.fg }]}>{t.sectionFree}</Text>
      {([
        ['🔤', t.tools.fonts.name, t.tools.fonts.blurb, () => onOpen('fonts')],
        ['#️⃣', t.tools.tags.name, t.tools.tags.blurb, () => onOpen('tags')],
        ['💌', t.inviteName, t.inviteBlurb, () => Share.share({ message: t.inviteMessage(INVITE_URL) }).catch(() => {})],
      ] as const).map(([icon, name, blurb, onPress]) => (
        <Pressable key={name} onPress={onPress} style={({ pressed }) => [s.row, { backgroundColor: c.card, borderColor: c.line }, pressed && s.pressed]}>
          <View style={[s.tileIcon, { backgroundColor: c.bg }]}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.tileName, { color: c.fg, marginTop: 0 }]}>{name}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{blurb}</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 22 }}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Copies text and briefly marks which item was copied.
function useCopy() {
  const [copied, setCopied] = useState('');
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(''), 1500);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = (text: string) => {
    Clipboard.setStringAsync(text).catch(() => {});
    setCopied(text);
  };
  return [copied, copy] as const;
}

function Fonts({ c, onBack }: { c: Colors; onBack: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<'fonts' | 'symbols'>('fonts');
  const [input, setInput] = useState('');
  const [copied, copy] = useCopy();
  const text = input.trim() || 'Vajb AI';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <BackRow c={c} onBack={onBack} />
        <View>
          <Text style={[s.h1, { color: c.fg }]}>🔤 {t.tools.fonts.title}</Text>
          <Text style={[s.sub, { color: c.muted }]}>{t.tools.fonts.subtitle}</Text>
        </View>
        <View style={[s.segment, { backgroundColor: c.card, borderColor: c.line }]}>
          {([['fonts', t.fontsTab], ['symbols', t.symbolsTab]] as const).map(([key, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[s.segmentBtn, tab === key && { backgroundColor: c.fg }]}>
              <Text style={{ color: tab === key ? c.bg : c.fg, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'fonts' ? (
          <>
            <View>
              <Text style={[s.label, { color: c.muted }]}>{t.fontsInputLabel.toUpperCase()}</Text>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={t.fontsPlaceholder}
                placeholderTextColor={c.muted}
                maxLength={100}
                style={[s.input, { backgroundColor: c.card, borderColor: c.line, color: c.fg, minHeight: 0 }]}
              />
            </View>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.tapToCopy}</Text>
            {FANCY_STYLES.map((st) => {
              const out = st.convert(text);
              const done = copied === out;
              return (
                <Pressable
                  key={st.id}
                  onPress={() => copy(out)}
                  style={({ pressed }) => [s.fontRow, { backgroundColor: c.card, borderColor: done ? c.ok : c.line }, pressed && s.pressed]}
                >
                  <Text style={{ color: c.fg, fontSize: 18, flex: 1 }}>{out}</Text>
                  <Text style={{ color: done ? c.ok : c.muted, fontWeight: '700', fontSize: 12 }}>{done ? t.copied : t.copy}</Text>
                </Pressable>
              );
            })}
          </>
        ) : (
          <>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.tapToCopy}</Text>
            {SYMBOL_GROUPS.map((g) => (
              <View key={g.id} style={{ gap: 8 }}>
                <Text style={[s.label, { color: c.muted, marginBottom: 0 }]}>{t.symbolGroups[g.id].toUpperCase()}</Text>
                <View style={s.chips}>
                  {g.items.map((x) => (
                    <Pressable
                      key={x}
                      onPress={() => copy(x)}
                      style={({ pressed }) => [s.symbol, { backgroundColor: c.card, borderColor: copied === x ? c.ok : c.line }, pressed && s.pressed]}
                    >
                      <Text style={{ color: c.fg, fontSize: 18 }}>{x}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            {!!copied && <Text style={{ color: c.ok, fontWeight: '700', textAlign: 'center' }}>{t.copied}</Text>}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tags({ c, onBack }: { c: Colors; onBack: () => void }) {
  const lang = useLang();
  const t = STRINGS[lang];
  const [copied, copy] = useCopy();
  return (
    <ScrollView contentContainerStyle={s.main}>
      <BackRow c={c} onBack={onBack} />
      <View>
        <Text style={[s.h1, { color: c.fg }]}>#️⃣ {t.tools.tags.title}</Text>
        <Text style={[s.sub, { color: c.muted }]}>{t.tools.tags.subtitle}</Text>
      </View>
      {HASHTAG_TOPICS.map((topic) => {
        const tags = topicTags(topic, lang);
        const done = copied === tags;
        return (
          <Pressable
            key={topic.id}
            onPress={() => copy(tags)}
            style={({ pressed }) => [s.card, { backgroundColor: c.card, borderColor: done ? c.ok : c.line }, pressed && s.pressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>{topic.icon}</Text>
              <Text style={{ color: c.fg, fontWeight: '800', fontSize: 16, flex: 1 }}>{topicName(topic, lang)}</Text>
              <Text style={{ color: done ? c.ok : c.accent, fontWeight: '700', fontSize: 12 }}>{done ? t.copied : t.copy}</Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }}>{tags}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DailyCard({ c }: { c: Colors }) {
  const lang = useLang();
  const t = STRINGS[lang];
  const [data, setData] = useState<Daily | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const key = `vajb-daily-${lang}`;
    const today = localDay(new Date());
    setData(null);
    setFailed(false);
    (async () => {
      try {
        const cached = JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');
        if (cached?.day === today) {
          if (alive) setData(cached.data);
          return;
        }
      } catch {
        // no cache, fetch below
      }
      try {
        const d = await getDaily(lang);
        if (!alive) return;
        setData(d);
        AsyncStorage.setItem(key, JSON.stringify({ day: today, data: d })).catch(() => {});
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  if (failed) return null;

  const rows: [string, string, keyof Daily, boolean][] = [
    ['📝', t.dailyCaption, 'caption', true],
    ['🎬', t.dailyTrend, 'trend', false],
    ['💭', t.dailyQuote, 'quote', true],
    ['🎯', t.dailyChallenge, 'challenge', false],
  ];

  return (
    <View style={[s.daily, { backgroundColor: c.card, borderColor: c.line }]}>
      <Text style={[s.dailyTitle, { color: c.accent }]}>✨ {t.dailyTitle.toUpperCase()}</Text>
      {!data ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.muted }}>{t.dailyLoading}</Text>
        </View>
      ) : (
        rows.map(([icon, label, key, copyable]) => (
          <DailyRow key={key} c={c} icon={icon} label={label} text={data[key]} copyable={copyable} />
        ))
      )}
    </View>
  );
}

function DailyRow({ c, icon, label, text, copyable }: { c: Colors; icon: string; label: string; text: string; copyable: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <View style={s.dailyRow}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
        <Text selectable style={{ color: c.fg, fontSize: 15, lineHeight: 21 }}>{text}</Text>
        {copyable && (
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(text);
              setCopied(true);
            }}
            style={[s.small, { borderColor: copied ? c.ok : c.line, alignSelf: 'flex-start', marginTop: 4 }]}
          >
            <Text style={{ color: copied ? c.ok : c.fg, fontWeight: '600', fontSize: 12 }}>{copied ? t.copied : t.copy}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Examples({ items, onPick, c }: { items?: string[]; onPick: (v: string) => void; c: Colors }) {
  const t = useT();
  if (!items?.length) return null;
  return (
    <View style={s.examples}>
      <Text style={{ color: c.muted, fontSize: 13, fontWeight: '700' }}>{t.tryThis}</Text>
      {items.map((x) => (
        <Pressable key={x} onPress={() => onPick(x)} style={({ pressed }) => [s.example, { borderColor: c.accent }, pressed && s.pressed]}>
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{x}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function BackRow({ c, onBack }: { c: Colors; onBack: () => void }) {
  const t = useT();
  return (
    <Pressable onPress={onBack} style={s.back} accessibilityRole="button">
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 15 }}>{t.back}</Text>
    </Pressable>
  );
}

function Chips({ field, value, onChange, c }: { field: Field; value: string; onChange: (v: string) => void; c: Colors }) {
  const lang = useLang();
  const t = STRINGS[lang];
  return (
    <View>
      <Text style={[s.label, { color: c.muted }]}>{(t.fields[field.label] ?? field.label).toUpperCase()}</Text>
      <View style={s.chips}>
        {field.options.map((o) => {
          const on = value === o;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[s.chip, { borderColor: on ? c.fg : c.line, backgroundColor: on ? c.fg : 'transparent' }]}
            >
              <Text style={[s.chipText, { color: on ? c.bg : c.fg }]}>{optionLabel(lang, o)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Generator({ tool, c, onBack, onRemaining, onLimit }: {
  tool: TextTool; c: Colors; onBack: () => void; onRemaining: (n: number | null) => void; onLimit: () => void;
}) {
  const lang = useLang();
  const t = STRINGS[lang];
  const tt = t.tools[tool.id];
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(tool.fields, lang));
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (!res.canceled && res.assets[0]?.base64) setPhoto(res.assets[0]);
  }

  async function run() {
    if (tool.photo === 'required' && !photo) {
      setError(t.needPhoto);
      return;
    }
    if (!input.trim() && !photo && !INPUT_OPTIONAL.includes(tool.id)) {
      setError(t.needText);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generate({
        mode: tool.id,
        lang,
        input: input.trim() || (INPUT_OPTIONAL.includes(tool.id) ? t.noDetails : ''),
        options,
        image: photo?.base64 ? { base64: photo.base64, mediaType: photo.mimeType ?? 'image/jpeg' } : undefined,
      });
      setResult(r);
      onRemaining(r.remaining);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'limit') {
        onRemaining(0);
        onLimit();
        return;
      }
      setError(errorText(e, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <BackRow c={c} onBack={onBack} />
        <View>
          <Text style={[s.h1, { color: c.fg }]}>{tool.icon} {tt.title}</Text>
          <Text style={[s.sub, { color: c.muted }]}>{tt.subtitle}</Text>
        </View>

        {tool.photo && (
          <Pressable onPress={pickPhoto} style={[s.photo, { borderColor: tool.photo === 'required' && !photo ? c.accent : c.line }]}>
            {photo ? <Image source={{ uri: photo.uri }} style={s.thumb} /> : <Text style={{ fontSize: 22 }}>📷</Text>}
            <Text style={[s.photoText, { color: c.muted }]}>
              {photo ? t.photoChange : tool.photo === 'required' ? t.photoChoose : t.photoOptional}
            </Text>
          </Pressable>
        )}

        <View>
          <Text style={[s.label, { color: c.muted }]}>{tt.inputLabel.toUpperCase()}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tt.placeholder}
            placeholderTextColor={c.muted}
            multiline
            maxLength={1000}
            style={[s.input, { backgroundColor: c.card, borderColor: c.line, color: c.fg }]}
          />
        </View>
        <Examples items={t.examples[tool.id]} onPick={setInput} c={c} />

        {tool.fields.map((f) => (
          <Chips key={f.key} field={f} value={options[f.key]} onChange={(v) => setOptions({ ...options, [f.key]: v })} c={c} />
        ))}

        <Pressable onPress={run} disabled={loading} style={[s.go, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}>
          {loading ? <ActivityIndicator color={c.accentFg} /> : <Text style={[s.goText, { color: c.accentFg }]}>{tt.button}</Text>}
        </Pressable>

        {!!error && <Text style={[s.sub, { color: c.muted }]}>{error}</Text>}

        {result?.items.map((item, i) => <ResultCard key={i} tool={tool.id} tag={item.tag} text={item.text} c={c} />)}
        {!!result?.hashtags && <ResultCard tool={tool.id} tag={t.hashtags} text={result.hashtags} c={c} muted />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultCard({ tool, tag, text, c, muted }: { tool: string; tag: string; text: string; c: Colors; muted?: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
      <Text style={[s.tag, { color: c.accent }]}>{tag.toUpperCase()}</Text>
      <Text selectable style={[s.cardText, { color: muted ? c.muted : c.fg, fontWeight: muted ? '600' : '400' }]}>{text}</Text>
      <View style={s.actions}>
        <Pressable
          onPress={async () => {
            await saveText(tool, tag, text);
            setSaved(true);
          }}
          style={[s.small, { borderColor: saved ? c.ok : c.line }]}
        >
          <Text style={{ color: saved ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{saved ? t.saved : t.save}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(text);
            setCopied(true);
          }}
          style={[s.small, { borderColor: copied ? c.ok : c.line }]}
        >
          <Text style={{ color: copied ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{copied ? t.copied : t.copy}</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function shareFile(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

type ImageToolProps = {
  c: Colors; left: number | null; setLeft: (n: number | null) => void; onBack: () => void; onLimit: () => void;
};

function ImageTool({ c, left, setLeft, onBack, onLimit }: ImageToolProps) {
  const lang = useLang();
  const t = STRINGS[lang];
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(IMAGE_FIELDS, lang));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [img, setImg] = useState<{ base64: string; mimeType: string; uri: string; prompt: string } | null>(null);
  const [saved, setSaved] = useState(false);

  async function run() {
    if (!input.trim()) {
      setError(t.imgNeedText);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generateImage(input.trim(), options, lang);
      const uri = writeImageFile(r.image, r.mimeType);
      setImg({ base64: r.image, mimeType: r.mimeType, uri, prompt: input.trim() });
      setSaved(false);
      setLeft(r.remaining);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'limit') setLeft(0);
      setError(errorText(e, t));
    } finally {
      setLoading(false);
    }
  }

  const ratio = options.format === 'Uspravno' ? 9 / 16 : options.format === 'Vodoravno' ? 16 / 9 : 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <BackRow c={c} onBack={onBack} />
        <View>
          <Text style={[s.h1, { color: c.fg }]}>🎨 {t.heroTitle}</Text>
          <Text style={[s.sub, { color: c.muted }]}>
            {t.imgSub} {left === null ? '' : left > 0 ? t.imgLeft(left) : t.imgNoneLeft}
            {left !== null && left < FREE_IMAGES_PER_DAY + 1 ? `\n${t.imgPoolNote}` : ''}
          </Text>
        </View>

        <View>
          <Text style={[s.label, { color: c.muted }]}>{t.imgInputLabel.toUpperCase()}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.imgPlaceholder}
            placeholderTextColor={c.muted}
            multiline
            maxLength={1000}
            style={[s.input, { backgroundColor: c.card, borderColor: c.line, color: c.fg }]}
          />
        </View>
        <Examples items={t.examples.image} onPick={setInput} c={c} />

        {IMAGE_FIELDS.map((f) => (
          <Chips key={f.key} field={f} value={options[f.key]} onChange={(v) => setOptions({ ...options, [f.key]: v })} c={c} />
        ))}

        {left === 0 ? (
          <Pressable onPress={onLimit} style={[s.go, { backgroundColor: c.sun }]}>
            <Text style={[s.goText, { color: c.sunFg }]}>{t.imgMorePremium}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={run} disabled={loading} style={[s.go, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}>
            {loading ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ActivityIndicator color={c.accentFg} />
                <Text style={{ color: c.accentFg, fontWeight: '600' }}>{t.imgDrawing}</Text>
              </View>
            ) : (
              <Text style={[s.goText, { color: c.accentFg }]}>{t.imgDraw}</Text>
            )}
          </Pressable>
        )}

        {!!error && <Text style={[s.sub, { color: c.muted }]}>{error}</Text>}

        {img && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
            <Image source={{ uri: img.uri }} style={{ width: '100%', aspectRatio: ratio, borderRadius: 12 }} resizeMode="cover" />
            <View style={s.actions}>
              <Pressable
                onPress={async () => {
                  await saveImage('image', img.prompt, img.base64, img.mimeType);
                  setSaved(true);
                }}
                disabled={saved}
                style={[s.small, { borderColor: saved ? c.ok : c.line }]}
              >
                <Text style={{ color: saved ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{saved ? t.saved : t.save}</Text>
              </Pressable>
              <Pressable onPress={() => shareFile(img.uri)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>{t.shareSave}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EditTool({ c, left, setLeft, onBack, onLimit }: ImageToolProps) {
  const lang = useLang();
  const t = STRINGS[lang];
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(EDIT_FIELDS, lang));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [img, setImg] = useState<{ base64: string; mimeType: string; uri: string; prompt: string; ratio: number } | null>(null);
  const [saved, setSaved] = useState(false);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
    if (!res.canceled && res.assets[0]?.base64) {
      setPhoto(res.assets[0]);
      setError('');
    }
  }

  async function run() {
    if (!photo?.base64) {
      setError(t.editNeedPhoto);
      return;
    }
    if (!input.trim()) {
      setError(t.editNeedText);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await editImage({ base64: photo.base64, mediaType: photo.mimeType ?? 'image/jpeg' }, input.trim(), options, lang);
      const uri = writeImageFile(r.image, r.mimeType);
      const next = { base64: r.image, mimeType: r.mimeType, uri, prompt: input.trim(), ratio: 1 };
      setImg(next);
      Image.getSize(uri, (w, h) => h > 0 && setImg({ ...next, ratio: w / h }), () => {});
      setSaved(false);
      setLeft(r.remaining);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'limit') setLeft(0);
      setError(errorText(e, t));
    } finally {
      setLoading(false);
    }
  }

  const photoRatio = photo?.width && photo?.height ? photo.width / photo.height : 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <BackRow c={c} onBack={onBack} />
        <View>
          <Text style={[s.h1, { color: c.fg }]}>🤳 {t.editHeroTitle}</Text>
          <Text style={[s.sub, { color: c.muted }]}>
            {t.editSub} {left === null ? '' : left > 0 ? t.imgLeft(left) : t.imgNoneLeft}
          </Text>
        </View>

        <Pressable onPress={pickPhoto} style={[s.editPhoto, { borderColor: photo ? c.line : c.accent, backgroundColor: c.card }]}>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: photoRatio, borderRadius: 12 }} resizeMode="cover" />
              <Text style={[s.photoText, { color: c.muted }]}>{t.photoChange}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={[s.photoText, { color: c.fg }]}>{t.editPhoto}</Text>
            </>
          )}
        </Pressable>
        <Text style={{ color: c.muted, fontSize: 12 }}>🔒 {t.editConsent}</Text>

        <View>
          <Text style={[s.label, { color: c.muted }]}>{t.editInputLabel.toUpperCase()}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.editPlaceholder}
            placeholderTextColor={c.muted}
            multiline
            maxLength={1000}
            style={[s.input, { backgroundColor: c.card, borderColor: c.line, color: c.fg }]}
          />
        </View>
        <Examples items={t.examples.edit} onPick={setInput} c={c} />

        {EDIT_FIELDS.map((f) => (
          <Chips key={f.key} field={f} value={options[f.key]} onChange={(v) => setOptions({ ...options, [f.key]: v })} c={c} />
        ))}

        {left === 0 ? (
          <Pressable onPress={onLimit} style={[s.go, { backgroundColor: c.sun }]}>
            <Text style={[s.goText, { color: c.sunFg }]}>{t.imgMorePremium}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={run} disabled={loading} style={[s.go, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}>
            {loading ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ActivityIndicator color={c.accentFg} />
                <Text style={{ color: c.accentFg, fontWeight: '600' }}>{t.editDoing}</Text>
              </View>
            ) : (
              <Text style={[s.goText, { color: c.accentFg }]}>{t.editDo}</Text>
            )}
          </Pressable>
        )}

        {!!error && <Text style={[s.sub, { color: c.muted }]}>{error}</Text>}

        {img && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
            <Image source={{ uri: img.uri }} style={{ width: '100%', aspectRatio: img.ratio, borderRadius: 12 }} resizeMode="cover" />
            <View style={s.actions}>
              <Pressable
                onPress={async () => {
                  await saveImage('edit', img.prompt, img.base64, img.mimeType);
                  setSaved(true);
                }}
                disabled={saved}
                style={[s.small, { borderColor: saved ? c.ok : c.line }]}
              >
                <Text style={{ color: saved ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{saved ? t.saved : t.save}</Text>
              </Pressable>
              <Pressable onPress={() => shareFile(img.uri)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>{t.shareSave}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Saved({ c }: { c: Colors }) {
  const t = useT();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const refresh = useCallback(() => {
    loadSaved().then(setItems);
  }, []);
  useEffect(refresh, [refresh]);

  if (items === null) return <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />;

  return (
    <ScrollView contentContainerStyle={s.main}>
      <View>
        <Text style={[s.h1, { color: c.fg }]}>{t.savedTitle}</Text>
        <Text style={[s.sub, { color: c.muted }]}>{items.length ? t.savedSub : t.savedEmpty}</Text>
      </View>
      {items.map((item) => (
        <View key={item.id} style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[s.tag, { color: c.accent }]}>
            {(t.tools[item.tool as ToolId]?.name ?? item.tool).toUpperCase()}
            {item.type === 'text' && item.tag ? ` · ${item.tag.toUpperCase()}` : ''}
          </Text>
          {item.type === 'text' ? (
            <Text selectable style={[s.cardText, { color: c.fg }]}>{item.text}</Text>
          ) : (
            <>
              <Image source={{ uri: item.uri }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} resizeMode="cover" />
              <Text style={{ color: c.muted, fontSize: 13 }}>{item.prompt}</Text>
            </>
          )}
          <View style={s.actions}>
            <Pressable
              onPress={async () => {
                await removeSaved(item.id);
                refresh();
              }}
              style={[s.small, { borderColor: c.line }]}
            >
              <Text style={{ color: c.muted, fontWeight: '600', fontSize: 13 }}>{t.remove}</Text>
            </Pressable>
            {item.type === 'text' ? (
              <Pressable onPress={() => Clipboard.setStringAsync(item.text)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>{t.copy}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => shareFile(item.uri)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>{t.share}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Premium({ c, active }: { c: Colors; active: boolean }) {
  const t = useT();
  const [plan, setPlan] = useState<'m' | 'y'>('y');
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View style={[s.proHero, { backgroundColor: c.fg }]}>
        <Text style={[s.proTitle, { color: c.bg }]}>Vajb Premium</Text>
        {t.proPerks.map((p) => (
          <Text key={p} style={{ color: c.bg, fontSize: 15 }}>•  {p}</Text>
        ))}
      </View>
      <View style={s.plans}>
        {([
          ['m', t.monthly, '3,99 €', t.cancelAnytime],
          ['y', t.yearly, '24,99 €', t.perMonth],
        ] as const).map(([key, name, price, note]) => (
          <Pressable key={key} onPress={() => setPlan(key)} style={[s.plan, { backgroundColor: c.card, borderColor: plan === key ? c.accent : c.line }]}>
            <Text style={{ color: c.muted, fontSize: 13 }}>{name}</Text>
            <Text style={[s.price, { color: c.fg }]}>{price}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{note}</Text>
          </Pressable>
        ))}
      </View>
      {active ? (
        <Text style={[s.sub, { color: c.fg }]}>{t.proActive}</Text>
      ) : (
        <>
          <View style={[s.go, { backgroundColor: c.accent, opacity: 0.6 }]}>
            <Text style={[s.goText, { color: c.accentFg }]}>{t.soon}</Text>
          </View>
          <Text style={[s.sub, { color: c.muted }]}>{t.proNote(FREE_TEXT_PER_DAY)}</Text>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  langMenu: { marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 14, padding: 6 },
  langItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10 },
  credits: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  creditsText: { fontSize: 13, fontWeight: '700' },
  main: { padding: 16, gap: 16 },
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 15, lineHeight: 21 },
  hero: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  blob: { position: 'absolute', width: 140, height: 140, borderRadius: 70, opacity: 0.45 },
  blobSmall: { width: 80, height: 80, borderRadius: 40 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  homeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  greet: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  streak: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 },
  daily: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 14 },
  dailyTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dailyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  section: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: -6 },
  example: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 12 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 99, padding: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 99 },
  fontRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  symbol: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  editPhoto: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 18, padding: 14, alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 19, fontWeight: '800', marginBottom: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', flexGrow: 1, borderRadius: 20, padding: 14, gap: 4 },
  tileName: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  back: { alignSelf: 'flex-start', paddingVertical: 2 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, minHeight: 84, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 14, fontWeight: '600' },
  photo: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, padding: 10 },
  photoText: { fontWeight: '600', fontSize: 15 },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  go: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  goText: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  tag: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  cardText: { fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  small: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  nav: { flexDirection: 'row', borderTopWidth: 1 },
  navBtn: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 6, gap: 2 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 12, fontWeight: '600' },
  proHero: { borderRadius: 20, padding: 20, gap: 8 },
  proTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  plans: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 12, gap: 2 },
  price: { fontSize: 22, fontWeight: '800' },
});
