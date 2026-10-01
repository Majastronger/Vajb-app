import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
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

type Field = { key: string; label: string; options: string[] };
type TextTool = {
  id: Mode;
  icon: string;
  name: string;
  blurb: string;
  title: string;
  subtitle: string;
  inputLabel: string;
  placeholder: string;
  fields: Field[];
  button: string;
  photo?: 'optional' | 'required';
};
type ToolId = Mode | 'image';

const TEXT_TOOLS: TextTool[] = [
  {
    id: 'caption', icon: '📸', name: 'Opis objave', blurb: 'Opis i hashtagovi',
    title: 'Opis za tvoju objavu',
    subtitle: 'Opiši fotku ili video, AI složi opis i hashtagove.',
    inputLabel: 'Što je na objavi?',
    placeholder: 'npr. Ja i ekipa na plaži u Makarskoj, zalazak sunca',
    fields: [
      { key: 'platform', label: 'Mreža', options: ['Instagram', 'TikTok', 'Facebook'] },
      { key: 'tone', label: 'Stil', options: ['Opušteno', 'Duhovito', 'Romantično', 'Motivacijski', 'Misteriozno'] },
      { key: 'language', label: 'Jezik', options: ['Hrvatski', 'English'] },
    ],
    button: 'Napravi opis ✨',
    photo: 'optional',
  },
  {
    id: 'reply', icon: '💬', name: 'Što da odgovorim?', blurb: 'Odgovori na poruke',
    title: 'Što da odgovorim?',
    subtitle: 'Zalijepi poruku koju si dobio/la i odaberi kako želiš zvučati.',
    inputLabel: 'Poruka koju si dobio/la',
    placeholder: 'npr. Hej, jesi za piće ovaj vikend? 🍹',
    fields: [
      { key: 'sender', label: 'Tko ti piše', options: ['Simpatija', 'Prijatelj', 'Ekipa u grupi', 'Posao'] },
      { key: 'tone', label: 'Kako želiš zvučati', options: ['Duhovito', 'Opušteno', 'Flert', 'Samouvjereno', 'Pristojno odbij'] },
    ],
    button: 'Predloži odgovore 💬',
  },
  {
    id: 'reel', icon: '🎬', name: 'Ideja za video', blurb: 'TikTok i Reels scenarij',
    title: 'Ideja za TikTok ili Reels',
    subtitle: 'Reci o čemu želiš snimiti, dobiješ scenarij kadar po kadar.',
    inputLabel: 'O čemu je video?',
    placeholder: 'npr. moja jutarnja rutina prije faksa',
    fields: [
      { key: 'platform', label: 'Za', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
      { key: 'length', label: 'Duljina', options: ['15 s', '30 s', '60 s'] },
      { key: 'style', label: 'Stil', options: ['Duhovito', 'Edukativno', 'Vlog', 'Trend', 'Prije/poslije'] },
    ],
    button: 'Smisli video 🎬',
  },
  {
    id: 'wish', icon: '💌', name: 'Čestitka', blurb: 'Rođendan, ljubav, prijatelji',
    title: 'Čestitka ili posveta',
    subtitle: 'Odaberi priliku i dodaj par detalja, dobiješ osobnu poruku.',
    inputLabel: 'Za koga je i neki detalj (nije obavezno)',
    placeholder: 'npr. Ivana, najbolja prijateljica, volimo karaoke i kavu',
    fields: [
      { key: 'occasion', label: 'Prilika', options: ['Rođendan', 'Godišnjica veze', 'Simpatiji', 'Prijatelju', 'Mami ili tati', 'Vjenčanje', 'Novi posao'] },
      { key: 'tone', label: 'Stil', options: ['Emotivno', 'Duhovito', 'Kratko i slatko', 'Pjesmica'] },
    ],
    button: 'Napiši poruku 💌',
  },
  {
    id: 'rate', icon: '⭐', name: 'Ocijeni fotku', blurb: 'Savjeti prije objave',
    title: 'Ocijeni moju fotku',
    subtitle: 'AI pogleda fotku i kaže kako je poboljšati prije objave.',
    inputLabel: 'Nešto dodatno (nije obavezno)',
    placeholder: 'npr. ne znam koji filter staviti',
    fields: [{ key: 'purpose', label: 'Fotka je za', options: ['Instagram objava', 'Profilna slika', 'Dating profil', 'TikTok naslovna'] }],
    button: 'Ocijeni ⭐',
    photo: 'required',
  },
  {
    id: 'bio', icon: '👤', name: 'Bio za profil', blurb: 'Instagram, TikTok, dating',
    title: 'Bio za profil',
    subtitle: 'Napiši par riječi o sebi, dobiješ bio za Instagram ili TikTok.',
    inputLabel: 'O tebi',
    placeholder: 'npr. studentica, Zagreb, volim kavu, techno i putovanja',
    fields: [
      { key: 'platform', label: 'Za', options: ['Instagram', 'TikTok', 'Tinder/Bumble', 'LinkedIn'] },
      { key: 'tone', label: 'Stil', options: ['Cool', 'Duhovito', 'Minimal', 'Ozbiljno'] },
    ],
    button: 'Napravi bio 🪄',
  },
];

const IMAGE_FIELDS: Field[] = [
  { key: 'style', label: 'Stil', options: ['Fotografija', 'Anime', 'Crtić', '3D', 'Akvarel', 'Neon'] },
  { key: 'format', label: 'Format', options: ['Kvadrat', 'Uspravno', 'Vodoravno'] },
];

const toolName = (id: string) => (id === 'image' ? 'Slika' : TEXT_TOOLS.find((t) => t.id === id)?.name ?? id);
const defaults = (fields: Field[]) => Object.fromEntries(fields.map((f) => [f.key, f.options[0]]));
const asError = (e: unknown) => (e instanceof ApiError ? e : new ApiError('unknown', 'Nešto je pošlo po zlu. Probaj opet.'));

type Tab = 'home' | 'saved' | 'pro';

export default function App() {
  const c = useColorScheme() === 'dark' ? dark : light;
  const [tab, setTab] = useState<Tab>('home');
  const [tool, setTool] = useState<ToolId | null>(null);
  const [textLeft, setTextLeft] = useState<number | null>(FREE_TEXT_PER_DAY);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
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
  }, [tool, tab]);

  const goPremium = () => {
    setTool(null);
    setTab('pro');
  };

  let screen;
  if (tab === 'home' && tool === 'image') {
    screen = <ImageTool c={c} onBack={() => setTool(null)} onLimit={goPremium} />;
  } else if (tab === 'home' && tool) {
    const t = TEXT_TOOLS.find((x) => x.id === tool)!;
    screen = <Generator key={t.id} tool={t} c={c} onBack={() => setTool(null)} onRemaining={setTextLeft} onLimit={goPremium} />;
  } else if (tab === 'home') {
    screen = <Home c={c} onOpen={setTool} />;
  } else if (tab === 'saved') {
    screen = <Saved c={c} />;
  } else {
    screen = <Premium c={c} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[s.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        <View style={s.header}>
          <Text style={[s.logo, { color: c.fg }]}>
            vajb<Text style={{ color: c.accent }}>.</Text>ai
          </Text>
          <View style={[s.credits, textLeft === null ? { backgroundColor: c.sun } : { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={[s.creditsText, { color: textLeft === null ? c.sunFg : c.fg }]}>
              {textLeft === null ? 'PREMIUM' : `${textLeft}/${FREE_TEXT_PER_DAY} danas`}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>{screen}</View>

        <View style={[s.nav, { borderTopColor: c.line }]}>
          {([
            ['home', '✨', 'Alati'],
            ['saved', '🔖', 'Spremljeno'],
            ['pro', '👑', 'Premium'],
          ] as const).map(([key, icon, label]) => (
            <Pressable
              key={key}
              style={s.navBtn}
              onPress={() => {
                setTab(key);
                setTool(null);
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
  );
}

function Home({ c, onOpen }: { c: Colors; onOpen: (id: ToolId) => void }) {
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View>
        <Text style={[s.h1, { color: c.fg }]}>Što radimo danas?</Text>
        <Text style={[s.sub, { color: c.muted }]}>Odaberi alat, AI napravi ostalo.</Text>
      </View>

      <Pressable onPress={() => onOpen('image')} style={[s.hero, { backgroundColor: c.fg }]}>
        <Text style={{ fontSize: 30 }}>🎨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroTitle, { color: c.bg }]}>Slika iz opisa</Text>
          <Text style={{ color: c.bg, opacity: 0.8 }}>Opiši što želiš, AI nacrta. Anime, 3D, foto…</Text>
        </View>
        <View style={[s.badge, { backgroundColor: c.sun }]}>
          <Text style={{ color: c.sunFg, fontWeight: '800', fontSize: 11 }}>NOVO</Text>
        </View>
      </Pressable>

      <View style={s.grid}>
        {TEXT_TOOLS.map((t) => (
          <Pressable key={t.id} onPress={() => onOpen(t.id)} style={[s.tile, { backgroundColor: c.card, borderColor: c.line }]}>
            <Text style={{ fontSize: 26 }}>{t.icon}</Text>
            <Text style={[s.tileName, { color: c.fg }]}>{t.name}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.blurb}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function BackRow({ c, onBack }: { c: Colors; onBack: () => void }) {
  return (
    <Pressable onPress={onBack} style={s.back} accessibilityRole="button">
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 15 }}>‹ Svi alati</Text>
    </Pressable>
  );
}

function Chips({ field, value, onChange, c }: { field: Field; value: string; onChange: (v: string) => void; c: Colors }) {
  return (
    <View>
      <Text style={[s.label, { color: c.muted }]}>{field.label.toUpperCase()}</Text>
      <View style={s.chips}>
        {field.options.map((o) => {
          const on = value === o;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[s.chip, { borderColor: on ? c.fg : c.line, backgroundColor: on ? c.fg : 'transparent' }]}
            >
              <Text style={[s.chipText, { color: on ? c.bg : c.fg }]}>{o}</Text>
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
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(tool.fields));
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
      setError('Prvo odaberi fotku.');
      return;
    }
    if (!input.trim() && !photo && tool.id !== 'wish') {
      setError('Napiši nešto u polje iznad.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generate({
        mode: tool.id,
        input: input.trim() || (tool.id === 'wish' ? 'nema dodatnih detalja' : ''),
        options,
        image: photo?.base64 ? { base64: photo.base64, mediaType: photo.mimeType ?? 'image/jpeg' } : undefined,
      });
      setResult(r);
      onRemaining(r.remaining);
    } catch (e) {
      const err = asError(e);
      if (err.code === 'limit') {
        onRemaining(0);
        onLimit();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.main} keyboardShouldPersistTaps="handled">
        <BackRow c={c} onBack={onBack} />
        <View>
          <Text style={[s.h1, { color: c.fg }]}>{tool.icon} {tool.title}</Text>
          <Text style={[s.sub, { color: c.muted }]}>{tool.subtitle}</Text>
        </View>

        {tool.photo && (
          <Pressable onPress={pickPhoto} style={[s.photo, { borderColor: tool.photo === 'required' && !photo ? c.accent : c.line }]}>
            {photo ? <Image source={{ uri: photo.uri }} style={s.thumb} /> : <Text style={{ fontSize: 22 }}>📷</Text>}
            <Text style={[s.photoText, { color: c.muted }]}>
              {photo ? 'Promijeni fotku' : tool.photo === 'required' ? 'Odaberi fotku' : 'Dodaj fotku (nije obavezno)'}
            </Text>
          </Pressable>
        )}

        <View>
          <Text style={[s.label, { color: c.muted }]}>{tool.inputLabel.toUpperCase()}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tool.placeholder}
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
          {loading ? <ActivityIndicator color={c.accentFg} /> : <Text style={[s.goText, { color: c.accentFg }]}>{tool.button}</Text>}
        </Pressable>

        {!!error && <Text style={[s.sub, { color: c.muted }]}>{error}</Text>}

        {result?.items.map((item, i) => <ResultCard key={i} tool={tool.id} tag={item.tag} text={item.text} c={c} />)}
        {!!result?.hashtags && <ResultCard tool={tool.id} tag="Hashtagovi" text={result.hashtags} c={c} muted />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultCard({ tool, tag, text, c, muted }: { tool: string; tag: string; text: string; c: Colors; muted?: boolean }) {
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
          <Text style={{ color: saved ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{saved ? 'Spremljeno ✓' : 'Spremi'}</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(text);
            setCopied(true);
          }}
          style={[s.small, { borderColor: copied ? c.ok : c.line }]}
        >
          <Text style={{ color: copied ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{copied ? 'Kopirano ✓' : 'Kopiraj'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function shareFile(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

function ImageTool({ c, onBack, onLimit }: { c: Colors; onBack: () => void; onLimit: () => void }) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Record<string, string>>(() => defaults(IMAGE_FIELDS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [left, setLeft] = useState<number | null>(FREE_IMAGES_PER_DAY);
  const [img, setImg] = useState<{ base64: string; mimeType: string; uri: string; prompt: string } | null>(null);
  const [saved, setSaved] = useState(false);

  async function run() {
    if (!input.trim()) {
      setError('Opiši što želiš na slici.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await generateImage(input.trim(), options);
      const uri = writeImageFile(r.image, r.mimeType);
      setImg({ base64: r.image, mimeType: r.mimeType, uri, prompt: input.trim() });
      setSaved(false);
      setLeft(r.remaining);
    } catch (e) {
      const err = asError(e);
      if (err.code === 'limit') {
        setLeft(0);
        setError(err.message);
        return;
      }
      setError(err.message);
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
          <Text style={[s.h1, { color: c.fg }]}>🎨 Slika iz opisa</Text>
          <Text style={[s.sub, { color: c.muted }]}>
            Opiši sliku, AI je nacrta. {left === null ? '' : left > 0 ? `Danas možeš još ${left}.` : 'Za danas su slike potrošene.'}
            {'\n'}Besplatnih slika ima ograničen broj svaki dan za sve korisnike, tko prvi, njegova. 😉
          </Text>
        </View>

        <View>
          <Text style={[s.label, { color: c.muted }]}>ŠTO ŽELIŠ NA SLICI?</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="npr. mačka s sunčanim naočalama na skuteru u Splitu, zalazak sunca"
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
            <Text style={[s.goText, { color: c.sunFg }]}>Više slika uz Premium 👑</Text>
          </Pressable>
        ) : (
          <Pressable onPress={run} disabled={loading} style={[s.go, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}>
            {loading ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ActivityIndicator color={c.accentFg} />
                <Text style={{ color: c.accentFg, fontWeight: '600' }}>Crtam… (do 30 s)</Text>
              </View>
            ) : (
              <Text style={[s.goText, { color: c.accentFg }]}>Nacrtaj 🎨</Text>
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
                <Text style={{ color: saved ? c.ok : c.fg, fontWeight: '600', fontSize: 13 }}>{saved ? 'Spremljeno ✓' : 'Spremi'}</Text>
              </Pressable>
              <Pressable onPress={() => shareFile(img.uri)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>Podijeli / spremi u galeriju</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Saved({ c }: { c: Colors }) {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const refresh = useCallback(() => {
    loadSaved().then(setItems);
  }, []);
  useEffect(refresh, [refresh]);

  if (items === null) return <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />;

  return (
    <ScrollView contentContainerStyle={s.main}>
      <View>
        <Text style={[s.h1, { color: c.fg }]}>Spremljeno</Text>
        <Text style={[s.sub, { color: c.muted }]}>
          {items.length ? 'Tvoji najdraži tekstovi i slike.' : 'Još ništa. Kod svakog rezultata dodirni "Spremi" i pojavit će se ovdje.'}
        </Text>
      </View>
      {items.map((item) => (
        <View key={item.id} style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[s.tag, { color: c.accent }]}>
            {toolName(item.tool).toUpperCase()}{item.type === 'text' && item.tag ? ` · ${item.tag.toUpperCase()}` : ''}
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
              <Text style={{ color: c.muted, fontWeight: '600', fontSize: 13 }}>Obriši</Text>
            </Pressable>
            {item.type === 'text' ? (
              <Pressable onPress={() => Clipboard.setStringAsync(item.text)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>Kopiraj</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => shareFile(item.uri)} style={[s.small, { borderColor: c.line }]}>
                <Text style={{ color: c.fg, fontWeight: '600', fontSize: 13 }}>Podijeli</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Premium({ c }: { c: Colors }) {
  const [plan, setPlan] = useState<'m' | 'y'>('y');
  return (
    <ScrollView contentContainerStyle={s.main}>
      <View style={[s.proHero, { backgroundColor: c.fg }]}>
        <Text style={[s.proTitle, { color: c.bg }]}>Vajb Premium</Text>
        {['Neograničeno tekstova', '20 slika dnevno', 'Bez reklama', 'Novi alati prvi'].map((t) => (
          <Text key={t} style={{ color: c.bg, fontSize: 15 }}>•  {t}</Text>
        ))}
      </View>
      <View style={s.plans}>
        {([
          ['m', 'Mjesečno', '3,99 €', 'otkaži kad želiš'],
          ['y', 'Godišnje · −48%', '24,99 €', '2,08 € mjesečno'],
        ] as const).map(([key, name, price, note]) => (
          <Pressable key={key} onPress={() => setPlan(key)} style={[s.plan, { backgroundColor: c.card, borderColor: plan === key ? c.accent : c.line }]}>
            <Text style={{ color: c.muted, fontSize: 13 }}>{name}</Text>
            <Text style={[s.price, { color: c.fg }]}>{price}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{note}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[s.go, { backgroundColor: c.accent, opacity: 0.6 }]}>
        <Text style={[s.goText, { color: c.accentFg }]}>Uskoro</Text>
      </View>
      <Text style={[s.sub, { color: c.muted }]}>
        Premium stiže uskoro. Do tada imaš {FREE_TEXT_PER_DAY} besplatnih tekstova i {FREE_IMAGES_PER_DAY} sliku svaki dan, dok ima besplatnih mjesta za taj dan.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
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
