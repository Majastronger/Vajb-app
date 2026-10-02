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
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, generate, generateImage, type GenerateResult, type Mode } from './src/api';
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

// Option values are the Croatian strings the server expects; labels come from i18n.
type Field = { key: string; label: string; options: string[] };
type TextTool = { id: Mode; icon: string; fields: Field[]; photo?: 'optional' | 'required' };

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
    id: 'reel', icon: '🎬',
    fields: [
      { key: 'platform', label: 'for', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
      { key: 'length', label: 'length', options: ['15 s', '30 s', '60 s'] },
      { key: 'style', label: 'style', options: ['Duhovito', 'Edukativno', 'Vlog', 'Trend', 'Prije/poslije'] },
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
  const t = STRINGS[lang];

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
    screen = <ImageTool c={c} onBack={() => setTool(null)} onLimit={goPremium} />;
  } else if (tab === 'home' && tool) {
    const tt = TEXT_TOOLS.find((x) => x.id === tool)!;
    screen = <Generator key={`${tt.id}-${lang}`} tool={tt} c={c} onBack={() => setTool(null)} onRemaining={setTextLeft} onLimit={goPremium} />;
  } else if (tab === 'home') {
    screen = <Home c={c} onOpen={setTool} />;
  } else if (tab === 'saved') {
    screen = <Saved c={c} />;
  } else {
    screen = <Premium c={c} />;
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

function Home({ c, onOpen }: { c: Colors; onOpen: (id: ToolId) => void }) {
  const t = useT();
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View>
        <Text style={[s.h1, { color: c.fg }]}>{t.homeTitle}</Text>
        <Text style={[s.sub, { color: c.muted }]}>{t.homeSub}</Text>
      </View>

      <Pressable onPress={() => onOpen('image')} style={[s.hero, { backgroundColor: c.fg }]}>
        <Text style={{ fontSize: 30 }}>🎨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroTitle, { color: c.bg }]}>{t.heroTitle}</Text>
          <Text style={{ color: c.bg, opacity: 0.8 }}>{t.heroSub}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: c.sun }]}>
          <Text style={{ color: c.sunFg, fontWeight: '800', fontSize: 11 }}>{t.badgeNew}</Text>
        </View>
      </Pressable>

      <View style={s.grid}>
        {TEXT_TOOLS.map((tool) => (
          <Pressable key={tool.id} onPress={() => onOpen(tool.id)} style={[s.tile, { backgroundColor: c.card, borderColor: c.line }]}>
            <Text style={{ fontSize: 26 }}>{tool.icon}</Text>
            <Text style={[s.tileName, { color: c.fg }]}>{t.tools[tool.id].name}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.tools[tool.id].blurb}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
    if (!input.trim() && !photo && tool.id !== 'wish') {
      setError(t.needText);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generate({
        mode: tool.id,
        lang,
        input: input.trim() || (tool.id === 'wish' ? t.noDetails : ''),
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

function ImageTool({ c, onBack, onLimit }: { c: Colors; onBack: () => void; onLimit: () => void }) {
  const lang = useLang();
  const t = STRINGS[lang];
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(IMAGE_FIELDS, lang));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [left, setLeft] = useState<number | null>(FREE_IMAGES_PER_DAY);
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
            {'\n'}
            {t.imgPoolNote}
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

function Premium({ c }: { c: Colors }) {
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
      <View style={[s.go, { backgroundColor: c.accent, opacity: 0.6 }]}>
        <Text style={[s.goText, { color: c.accentFg }]}>{t.soon}</Text>
      </View>
      <Text style={[s.sub, { color: c.muted }]}>{t.proNote(FREE_TEXT_PER_DAY)}</Text>
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
  hero: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTitle: { fontSize: 19, fontWeight: '800', marginBottom: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 },
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
